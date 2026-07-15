import base64
import io
import json
import os
import sys

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import numpy as np
import tensorflow as tf
from PIL import Image


def read_payload():
    raw = sys.stdin.read()
    if not raw.strip():
        raise ValueError("Missing inference payload.")
    return json.loads(raw)


def load_class_names(class_names_path):
    with open(class_names_path, "r", encoding="utf-8") as file:
        class_info = json.load(file)

    if isinstance(class_info, list):
        return class_info

    if isinstance(class_info, dict):
        if isinstance(class_info.get("class_names"), list):
            return class_info["class_names"]

        id_to_label = class_info.get("id_to_label") or class_info
        if isinstance(id_to_label, dict):
            return [id_to_label[str(index)] for index in range(len(id_to_label))]

    raise ValueError("class_names file must be a list or an object with class_names/id_to_label.")


def preprocess_image(image_data, image_size, normalization="raw"):
    encoded = image_data.split(",", 1)[1] if "," in image_data else image_data
    image = Image.open(io.BytesIO(base64.b64decode(encoded)))
    if image.mode != "RGB":
        image = image.convert("RGB")

    image = image.resize((image_size, image_size))
    image_array = np.asarray(image).astype(np.float32)

    if normalization == "zero_to_one":
        image_array = image_array / 255.0
    elif normalization == "signed":
        image_array = (image_array / 255.0 - 0.5) / 0.5
    elif normalization != "raw":
        raise ValueError(f"Unsupported normalization mode: {normalization}")

    return np.expand_dims(image_array, axis=0)


def softmax(values):
    values = np.asarray(values, dtype=np.float32)
    if np.all(values >= 0) and np.all(values <= 1) and np.isclose(np.sum(values), 1.0, atol=1e-3):
        return values

    shifted = values - np.max(values)
    exp_values = np.exp(shifted)
    return exp_values / np.sum(exp_values)


def main():
    payload = read_payload()
    model_path = payload["modelPath"]
    class_names = load_class_names(payload["classNamesPath"])
    image_size = int(payload.get("imageSize", 300))
    normalization = payload.get("normalization", "raw")

    model = tf.keras.models.load_model(model_path, compile=False)
    input_data = preprocess_image(payload["imageData"], image_size, normalization)
    outputs = model.predict(input_data, verbose=0)
    probabilities = softmax(outputs[0])

    if len(probabilities) != len(class_names):
        raise ValueError(
            f"Model output has {len(probabilities)} classes but class_names has {len(class_names)} labels."
        )

    top_indices = np.argsort(probabilities)[::-1]
    top_predictions = [
        {
            "label": str(class_names[int(index)]),
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
