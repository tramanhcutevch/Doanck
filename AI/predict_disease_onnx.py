import base64
import io
import json
import sys

import numpy as np
import onnxruntime as ort
from PIL import Image


def read_payload():
    raw = sys.stdin.read()
    if not raw.strip():
        raise ValueError("Missing inference payload.")
    return json.loads(raw)


def preprocess_image(image_data, image_size, input_shape=None, normalization="signed"):
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

    # Support both common ONNX image layouts:
    # NCHW: [batch, channels, height, width]
    # NHWC: [batch, height, width, channels]
    if input_shape and len(input_shape) == 4 and input_shape[-1] == 3:
        return np.expand_dims(image_array, axis=0)

    image_array = image_array.transpose(2, 0, 1)
    return np.expand_dims(image_array, axis=0)


def softmax(logits):
    logits = np.asarray(logits, dtype=np.float32)
    if np.all(logits >= 0) and np.all(logits <= 1) and np.isclose(np.sum(logits), 1.0, atol=1e-3):
        return logits

    shifted = logits - np.max(logits)
    exp_logits = np.exp(shifted)
    return exp_logits / np.sum(exp_logits)


def load_class_names(class_names_path):
    with open(class_names_path, "r", encoding="utf-8") as file:
        class_info = json.load(file)

    if isinstance(class_info, list):
        return class_info

    if isinstance(class_info, dict):
        if isinstance(class_info.get("class_names"), list):
            return class_info["class_names"]

        id_to_label = class_info.get("id_to_label")
        if isinstance(id_to_label, dict):
            return [id_to_label[str(index)] for index in range(len(id_to_label))]

    raise ValueError("class_names file must be a list or an object with class_names/id_to_label.")


def main():
    payload = read_payload()
    model_path = payload["modelPath"]
    class_names_path = payload["classNamesPath"]
    image_size = int(payload.get("imageSize", 32))
    normalization = payload.get("normalization", "signed")

    class_names = load_class_names(class_names_path)

    session = ort.InferenceSession(model_path)
    model_input = session.get_inputs()[0]
    input_name = model_input.name
    input_data = preprocess_image(payload["imageData"], image_size, model_input.shape, normalization)
    outputs = session.run(None, {input_name: input_data})
    probabilities = softmax(outputs[0][0])

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
