---
tags:
  - image-classification
  - pytorch
  - resnet
  - computer-vision
  - agriculture
  - plant-diseases
  - bell-pepper
---

# 🫑 Bell Pepper Disease Classifier

A PyTorch-based image classification model that analyzes bell pepper leaf images to classify the presence of diseases.

---

## 🌿 Model Overview

- **Architecture**: ResNet-50 (pretrained on ImageNet)
- **Number of Classes**: 13 (including healthy and diseased states)

### Classification Labels:
- Aphid  
- Bacterial spot  
- Blossom end rot  
- Burn  
- Edema  
- Healthy  
- Leaf curl  
- Leaf miners  
- Mosaic virus  
- Nutrient deficiency  
- Powdery mildew  
- Spider mite  
- Thrips

> 🎯 **Main Goal**: Enhance agricultural productivity by enabling early detection of bell pepper diseases through image-based diagnosis.

---

## 📚 Training Dataset Sources

This model was trained using a combination of publicly available Kaggle datasets. We comply with their licenses and terms of use.

1. **Plant Village Dataset**  
   - 📦 Provider: `Mohit Singh 1804`  
   - 🔗 [Link](https://www.kaggle.com/datasets/mohitsingh1804/plantvillage)  
   - 📌 Used bell pepper-specific images only.

2. **Pepper Disease Classification Dataset (DoctorP)**  
   - 📦 Provider: `Alexander Uzhinskiy`  
   - 🔗 [Link](https://www.kaggle.com/datasets/alexanderuzhinskiy/pepper-disease-classification-dataset-doctorp)

3. **Pepper Leaf Diseases Plant Village Augmented Data**  
   - 📦 Provider: `Shuvo Kumar Basak-4004.o`  
   - 🔗 [Link](https://www.kaggle.com/datasets/shuvokumarbasak2030/pepper-leaf-diseases-plant-village-augmented-data)

---

## 📊 Model Performance

- **Overall Accuracy**: *Please insert final validation accuracy here (e.g., 0.9876)*
- **Confusion Matrix**: *(Optional) Include a confusion matrix image or brief explanation here*

---

## 🚀 How to Use (PyTorch Example)

```python
from transformers import AutoModelForImageClassification, AutoImageProcessor
import torch
from PIL import Image
import requests

# 1. Load the model and image processor
model_name = "valla2345/bell-pepper-disease-classifier"
processor = AutoImageProcessor.from_pretrained(model_name)
model = AutoModelForImageClassification.from_pretrained(model_name)

# 2. Load an example image
image_url = "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/pytorch-logo.png"
image = Image.open(requests.get(image_url, stream=True).raw).convert("RGB")

# 3. Preprocess the image
inputs = processor(images=image, return_tensors="pt")

# 4. Perform prediction
with torch.no_grad():
    logits = model(**inputs).logits

# 5. Interpret results
predicted_label_id = logits.argmax(-1).item()
predicted_label = model.config.id2label[predicted_label_id]

print(f"Predicted Disease: {predicted_label}")
```

---

## 📝 License

This model is distributed under the **Apache 2.0 License**.  
> ⚠️ Please also check individual dataset licenses for any additional restrictions.

---

## 🤝 Contributions and Contact

For feedback, bug reports, or contributions, please open an issue in the [Community tab](https://huggingface.co/valla2345/bell-pepper-disease-classifier/discussions), or reach out via GitHub/Email.

---

🌱 *Together, let’s support precision agriculture with AI!*

---

## Code used in development
``` python

from google.colab import drive
drive.mount('/content/drive')

import os

os.environ['KAGGLE_CONFIG_DIR'] = '/content/drive/MyDrive/Kaggle'
os.environ['KAGGLE_API_HABIBI'] = 'true'

project_root = '/content/bell_pepper_project'

if not os.path.exists(project_root):
    os.makedirs(project_root)

os.chdir(project_root)

try:
    import kagglehub
except ImportError:
    pass

import kagglehub
import os

downloaded_dataset_paths = {}

def download_kaggle_dataset(dataset_id, key_name):
    try:
        path = kagglehub.dataset_download(dataset_id)
        return path
    except Exception:
        return None

# Plant Village Dataset
dataset_id_plant_village = "mohitsingh1804/plantvillage"
downloaded_dataset_paths['plant_village'] = download_kaggle_dataset(dataset_id_plant_village, 'plant_village')

# Pepper Disease Classification Dataset (DoctorP)
dataset_id_pepper_doctorp = "alexanderuzhinskiy/pepper-disease-classification-dataset-doctorp"
downloaded_dataset_paths['pepper_disease_doctorp'] = download_kaggle_dataset(dataset_id_pepper_doctorp, 'pepper_disease_doctorp')

# Pepper Leaf Diseases Plant Village Augmented Data
dataset_id_pepper_leaf_diseases_augmented = "shuvokumarbasak2030/pepper-leaf-diseases-plant-village-augmented-data"
downloaded_dataset_paths['pepper_leaf_diseases_augmented'] = download_kaggle_dataset(dataset_id_pepper_leaf_diseases_augmented, 'pepper_leaf_diseases_augmented')

import torch
import torchvision
from torchvision import transforms, datasets
from torch.utils.data import DataLoader, random_split, ConcatDataset
import torch.nn as nn
import torch.optim as optim
from torchvision import models
import time
import copy
import os

# Set global optimization
torch.backends.cudnn.benchmark = True

# Initialize GradScaler for mixed precision
scaler = torch.cuda.amp.GradScaler()

# Device configuration
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

# Ensure project_root is defined and set
if 'project_root' not in globals():
    project_root = '/content/bell_pepper_project'
    if not os.path.exists(project_root):
        os.makedirs(project_root)
    os.chdir(project_root)

# Ensure downloaded_dataset_paths exists
if 'downloaded_dataset_paths' not in globals() or not downloaded_dataset_paths:
    downloaded_dataset_paths = {}

import os
from torch.utils.data import Dataset
from torchvision.datasets import ImageFolder
from PIL import Image
import torch

if 'downloaded_dataset_paths' not in globals() or not downloaded_dataset_paths:
    downloaded_dataset_paths = {}

unified_classes = [
    "Aphid", "Bacterial spot", "Blossom end rot", "Burn",
    "Edema", "Healthy", "Leaf curl", "Leaf miners",
    "Mosaic virus", "Nutrient deficiency", "Powdery mildew",
    "Spider mite", "Thrips"
]

unified_class_to_idx = {cls_name: i for i, cls_name in enumerate(unified_classes)}
num_classes = len(unified_classes)

dataset_paths_info = {
    'plant_village': {
        'root': downloaded_dataset_paths.get('plant_village'),
        'subfolders': ['PlantVillage/train', 'PlantVillage/val']
    },
    'pepper_disease_doctorp': {
        'root': downloaded_dataset_paths.get('pepper_disease_doctorp'),
        'subfolders': ['Pepper']
    },
    'pepper_leaf_diseases_augmented': {
        'root': downloaded_dataset_paths.get('pepper_leaf_diseases_augmented'),
        'subfolders': ['Pepper']
    }
}

class_mapping = {
    "Aphid": "Aphid", "Bacterial spot": "Bacterial spot", "Blossom end rot": "Blossom end rot",
    "Burn": "Burn", "Edema": "Edema", "Healthy": "Healthy", "Leaf curl": "Leaf curl",
    "Leaf miners": "Leaf miners", "Mosaic virus": "Mosaic virus", "Nutrient deficiency": "Nutrient deficiency",
    "Powdery mildew": "Powdery mildew", "Spider mite": "Spider mite", "Thrips": "Thrips",
    "Pepper,_bell___Bacterial_spot": "Bacterial spot", "Pepper,_bell___healthy": "Healthy"
}

class RemapDataset(Dataset):
    def __init__(self, original_dataset, class_mapping, unified_class_to_idx, transform=None):
        self.original_dataset = original_dataset
        self.class_mapping = class_mapping
        self.unified_class_to_idx = unified_class_to_idx
        self.transform = transform
        self.data = []
        filtered_count = 0
        total_count = 0
        for img_path, original_label_idx in original_dataset.samples:
            total_count += 1
            original_class_name = original_dataset.classes[original_label_idx]
            if original_class_name in self.class_mapping:
                unified_class_name = self.class_mapping[original_class_name]
                if unified_class_name in self.unified_class_to_idx:
                    unified_label_idx = self.unified_class_to_idx[unified_class_name]
                    self.data.append((img_path, unified_label_idx))
                    filtered_count += 1
        if filtered_count == 0 and total_count > 0:
            pass

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        img_path, label = self.data[idx]
        image = Image.open(img_path).convert("RGB")
        if self.transform:
            image = self.transform(image)
        return image, label

    @property
    def classes(self):
        return unified_classes

    @property
    def class_to_idx(self):
        return unified_class_to_idx

import torchvision.transforms as transforms

IMG_SIZE = 224
MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]

train_transforms = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(10),
    transforms.ToTensor(),
    transforms.Normalize(mean=MEAN, std=STD)
])

val_test_transforms = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=MEAN, std=STD)
])

import os
from torchvision.datasets import ImageFolder
from torch.utils.data import ConcatDataset, random_split
from PIL import Image

all_processed_datasets = []

for name, info in dataset_paths_info.items():
    dataset_root_path = info['root']
    subfolders_to_check = info['subfolders']

    if dataset_root_path is None:
        continue

    for sub_path_suffix in subfolders_to_check:
        full_path = os.path.join(dataset_root_path, sub_path_suffix)
        if os.path.exists(full_path):
            try:
                original_dataset = ImageFolder(root=full_path, transform=train_transforms)
                remapped_dataset = RemapDataset(
                    original_dataset=original_dataset,
                    class_mapping=class_mapping,
                    unified_class_to_idx=unified_class_to_idx,
                    transform=train_transforms
                )
                if len(remapped_dataset) > 0:
                    all_processed_datasets.append(remapped_dataset)
            except Exception:
                pass

combined_full_dataset = ConcatDataset(all_processed_datasets)
train_size = int(0.8 * len(combined_full_dataset))
val_size = len(combined_full_dataset) - train_size
train_dataset, val_dataset = random_split(combined_full_dataset, [train_size, val_size])

import torch
from torch.utils.data import DataLoader

BATCH_SIZE = 64
NUM_WORKERS = 4

train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=NUM_WORKERS, pin_memory=True)
val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=NUM_WORKERS, pin_memory=True)

num_classes = len(unified_classes)

import torch.nn as nn
import torchvision.models as models

model_ft = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)
num_ftrs = model_ft.fc.in_features
model_ft.fc = nn.Linear(num_ftrs, num_classes)
model_ft = model_ft.to(device)

import torch
import torch.nn as nn
import torch.optim as optim
import time
import copy

criterion = nn.CrossEntropyLoss()
optimizer_ft = optim.Adam(model_ft.parameters(), lr=0.001)

def train_model(model, criterion, optimizer, num_epochs=25, scaler=None):
    """
    Train and validate the model.
    Args:
        model (torch.nn.Module): The model to train.
        criterion (torch.nn.Module): Loss function.
        optimizer (torch.optim.Optimizer): Optimizer.
        num_epochs (int): Total number of epochs to train.
        scaler (torch.cuda.amp.GradScaler, optional): GradScaler for mixed-precision training.
            Default is None (mixed-precision not used).
    Returns:
        torch.nn.Module: The model with the best validation accuracy weights loaded.
    """
    start_time = time.time()
    best_model_wts = copy.deepcopy(model.state_dict())
    best_acc = 0.0

    for epoch in range(num_epochs):
        for phase in ['train', 'val']:
            if phase == 'train':
                model.train()
                dataloader = train_loader
            else:
                model.eval()
                dataloader = val_loader

            running_loss = 0.0
            running_corrects = 0

            for inputs, labels in dataloader:
                inputs = inputs.to(device)
                labels = labels.to(device)
                optimizer.zero_grad()

                with torch.set_grad_enabled(phase == 'train'):
                    with torch.cuda.amp.autocast(enabled=(scaler is not None)):
                        outputs = model(inputs)
                        loss = criterion(outputs, labels)
                    _, preds = torch.max(outputs, 1)

                    if phase == 'train':
                        if scaler is not None:
                            scaler.scale(loss).backward()
                            scaler.step(optimizer)
                            scaler.update()
                        else:
                            loss.backward()
                            optimizer.step()

                running_loss += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)

            epoch_loss = running_loss / len(dataloader.dataset)
            epoch_acc = running_corrects.double() / len(dataloader.dataset)

            if phase == 'val' and epoch_acc > best_acc:
                best_acc = epoch_acc
                best_model_wts = copy.deepcopy(model.state_dict())

    model.load_state_dict(best_model_wts)
    return model

num_epochs_to_train = 20
model_ft = train_model(
    model_ft,
    criterion,
    optimizer_ft,
    num_epochs=num_epochs_to_train,
    scaler=scaler
)

if 'unified_classes' not in globals():
    raise NameError("'unified_classes' not defined. Execute previous cells.")

model_ft.eval()
all_preds = []
all_labels = []

with torch.no_grad():
    for inputs, labels in val_loader:
        inputs = inputs.to(device)
        labels = labels.to(device)
        outputs = model_ft(inputs)
        _, preds = torch.max(outputs, 1)
        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())

all_preds = np.array(all_preds)
all_labels = np.array(all_labels)

cm = confusion_matrix(all_labels, all_preds)

plt.figure(figsize=(15, 12))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=unified_classes,
            yticklabels=unified_classes)
plt.xlabel('Predicted Class')
plt.ylabel('True Class')
plt.title('Confusion Matrix')
plt.xticks(rotation=90)
plt.yticks(rotation=0)
plt.tight_layout()
plt.show()

overall_accuracy = np.sum(all_preds == all_labels) / len(all_labels)

!pip install huggingface_hub -q

from huggingface_hub import HfApi, login
import torch
import json
import os

login(token="")

repo_id = "valla2345/bell-pepper-disease-classifier"

model_ft.cpu()
torch.save(model_ft.state_dict(), "pytorch_model.bin")
model_ft.to(device)

model_config = {
    "architectures": ["ResNetForImageClassification"],
    "model_type": "resnet",
    "num_labels": len(unified_classes),
    "id2label": {str(i): label for i, label in enumerate(unified_classes)},
    "label2id": {label: str(i) for i, label in enumerate(unified_classes)},
    "image_size": 224,
    "mean": [0.485, 0.456, 0.406],
    "std": [0.229, 0.224, 0.225],
    "tags": ["image-classification", "pytorch", "resnet", "computer-vision", "agriculture"],
}
with open("config.json", "w") as f:
    json.dump(model_config, f, indent=4)

api = HfApi()
try:
    api.create_repo(repo_id=repo_id, exist_ok=True, private=False)
    api.upload_file(path_or_fileobj="pytorch_model.bin", path_in_repo="pytorch_model.bin", repo_id=repo_id)
    api.upload_file(path_or_fileobj="config.json", path_in_repo="config.json", repo_id=repo_id)
except Exception:
    pass
```






