import base64
import io
import json
import ssl
import sys

import joblib
import numpy as np
import torch
from PIL import Image
from torchvision import models, transforms


CLASS_LABELS = [
    "Cercospora Leaf Spot (Gray Leaf Spot)",
    "Common Rust",
    "Northern Leaf Blight",
    "Healthy",
    "Other",
]

CLASS_LABEL_ALIASES = {
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": "Cercospora Leaf Spot (Gray Leaf Spot)",
    "Corn_(maize)___Common_rust_": "Common Rust",
    "Corn_(maize)___Northern_Leaf_Blight": "Northern Leaf Blight",
    "Corn_(maize)___healthy": "Healthy",
    "healthy": "Healthy",
    "other": "Other",
}

ssl._create_default_https_context = ssl._create_unverified_context


def read_payload():
    raw = sys.stdin.read()
    if not raw.strip():
        raise ValueError("Missing inference payload.")
    return json.loads(raw)


def preprocess_image(image_data, image_size):
    encoded = image_data.split(",", 1)[1] if "," in image_data else image_data
    image = Image.open(io.BytesIO(base64.b64decode(encoded))).convert("RGB")

    transform = transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ]
    )
    return transform(image).unsqueeze(0)


def build_feature_extractor(bundle):
    model = models.mobilenet_v2(weights=None)
    state_dict = bundle.get("mobilenet_v2_weights") if isinstance(bundle, dict) else None
    if state_dict is not None:
        model.load_state_dict(state_dict)

    model.classifier = torch.nn.Identity()
    model.eval()
    return model


def resolve_classifier_bundle(bundle):
    if hasattr(bundle, "predict_proba"):
        return bundle, CLASS_LABELS

    if not isinstance(bundle, dict):
        raise ValueError("Unsupported maize model bundle.")

    classifier = bundle.get("maize_model") or bundle.get("corn_model")
    class_labels = bundle.get("maize_classes") or bundle.get("classes") or CLASS_LABELS
    if classifier is None or not hasattr(classifier, "predict_proba"):
        raise ValueError("Maize model bundle does not contain a classifier with predict_proba.")

    return classifier, [str(label) for label in class_labels]


def normalize_class_label(label):
    return CLASS_LABEL_ALIASES.get(str(label), str(label))


def main():
    payload = read_payload()
    model_path = payload["modelPath"]
    image_size = int(payload.get("imageSize", 224))

    bundle = joblib.load(model_path)
    classifier, class_labels = resolve_classifier_bundle(bundle)
    mobilenet = build_feature_extractor(bundle)
    image_tensor = preprocess_image(payload["imageData"], image_size)

    with torch.no_grad():
        features = mobilenet(image_tensor).numpy()

    probabilities = classifier.predict_proba(features)[0]
    top_indices = np.argsort(probabilities)[::-1]
    top_predictions = [
        {
            "label": normalize_class_label(class_labels[int(index)]),
            "confidence": float(probabilities[int(index)]),
        }
        for index in top_indices
    ]
    top = top_predictions[0]

    print(
        json.dumps(
            {
                "label": top["label"],
                "confidence": top["confidence"],
                "outputCount": int(len(probabilities)),
                "topPredictions": top_predictions,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
