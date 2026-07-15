import base64
import io
import json
import sys
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)
import torch
from PIL import Image
from transformers import ViTForImageClassification, ViTImageProcessor


def read_payload():
    raw = sys.stdin.read()
    if not raw.strip():
        raise ValueError("Missing inference payload.")
    return json.loads(raw)


def load_image(image_data):
    encoded = image_data.split(",", 1)[1] if "," in image_data else image_data
    image = Image.open(io.BytesIO(base64.b64decode(encoded)))
    if image.mode != "RGB":
        image = image.convert("RGB")
    return image


def softmax(logits):
    return torch.softmax(logits, dim=-1)[0]


def main():
    payload = read_payload()
    model_dir = payload["modelPath"]
    image = load_image(payload["imageData"])

    processor = ViTImageProcessor.from_pretrained(model_dir)
    model = ViTForImageClassification.from_pretrained(model_dir)
    model.eval()

    inputs = processor(images=image, return_tensors="pt")

    with torch.no_grad():
        outputs = model(**inputs)

    probabilities = softmax(outputs.logits)
    top_indices = torch.argsort(probabilities, descending=True).tolist()
    id_to_label = model.config.id2label
    top_predictions = [
        {
            "label": str(id_to_label[int(index)]),
            "confidence": float(probabilities[int(index)].item()),
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
                "selectedModel": "ViTForImageClassification google/vit-base-patch16-224-in21k fine-tuned bean v1",
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
