"""
AgriBot Maize Disease Diagnosis - Inference Example
Ekip Crusaders - AYITI IA 2025 Hackathon
"""

import joblib
import torch
import numpy as np
from PIL import Image
from torchvision import models, transforms
import sys
from pathlib import Path


class AgribotInference:
    """Wrapper class for AgriBot model inference"""
    
    def __init__(self, model_path='agribot_models.pkl'):
        print("Loading AgriBot model...")
        self.model = joblib.load(model_path)
        
        print("Loading MobileNetV2 feature extractor...")
        self.mobilenet = models.mobilenet_v2(pretrained=True)
        self.mobilenet.classifier = torch.nn.Identity()
        self.mobilenet.eval()
        
        self.class_labels = [
            "Cercospora Leaf Spot (Gray Leaf Spot)",
            "Common Rust",
            "Northern Leaf Blight",
            "Healthy",
            "Other"
        ]
        
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
        
        print("Model loaded successfully!")
    
    def preprocess_image(self, image_path):
        image = Image.open(image_path).convert('RGB')
        return self.transform(image).unsqueeze(0)
    
    def extract_features(self, img_tensor):
        with torch.no_grad():
            features = self.mobilenet(img_tensor)
        return features.numpy()
    
    def predict(self, image_path):
        img_tensor = self.preprocess_image(image_path)
        features = self.extract_features(img_tensor)
        
        prediction_idx = self.model.predict(features)[0]
        probabilities = self.model.predict_proba(features)[0]
        confidence = float(np.max(probabilities) * 100)
        diagnosis = self.class_labels[prediction_idx]
        
        prob_dist = {
            label: float(prob * 100)
            for label, prob in zip(self.class_labels, probabilities)
        }
        
        return {
            'diagnosis': diagnosis,
            'confidence': round(confidence, 2),
            'prediction_index': int(prediction_idx),
            'probabilities': prob_dist,
            'is_healthy': diagnosis == "Healthy",
            'is_maize': diagnosis != "Other"
        }


def main():
    if len(sys.argv) < 2:
        print("Usage: python inference_example.py <image_path>")
        print("Example: python inference_example.py maize_leaf.jpg")
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    if not Path(image_path).exists():
        print(f"Error: Image file '{image_path}' not found!")
        sys.exit(1)
    
    predictor = AgribotInference()
    
    print(f"\nAnalyzing image: {image_path}")
    print("-" * 50)
    
    result = predictor.predict(image_path)
    
    print(f"\n🌽 DIAGNOSIS: {result['diagnosis']}")
    print(f"📊 Confidence: {result['confidence']:.2f}%")
    print(f"🔍 Is Maize: {'Yes' if result['is_maize'] else 'No'}")
    print(f"✅ Is Healthy: {'Yes' if result['is_healthy'] else 'No'}")
    
    print("\n📈 Probability Distribution:")
    for disease, prob in result['probabilities'].items():
        bar_length = int(prob / 2)
        bar = "█" * bar_length
        print(f"  {disease:40s} {prob:6.2f}% {bar}")
    
    print("\n" + "-" * 50)
    print("Analysis complete!")


if __name__ == "__main__":
    main()
