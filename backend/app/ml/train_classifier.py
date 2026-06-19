import os
import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import models, transforms
from PIL import Image
import hashlib

# Classes list (14 target categories)
CLASSES = [
    "chest", "skull", "spine", "teeth", "hand", 
    "wrist", "elbow", "shoulder", "hip", "knee", 
    "leg", "ankle", "foot", "ribs"
]

def generate_synthetic_xray(category: str) -> np.ndarray:
    """
    Generates a synthetic grayscale image of size 224x224 mimicking specific X-ray regions.
    """
    img = np.zeros((224, 224), dtype=np.uint8)
    
    # Base clinical background noise
    noise = np.random.normal(30, 8, (224, 224))
    img = np.clip(img + noise, 0, 255).astype(np.uint8)
    
    # Draw characteristic anatomy shapes
    if category == "chest":
        # Two darker lung lobes
        cv2.ellipse(img, (75, 112), (30, 75), 0, 0, 360, 15, -1)
        cv2.ellipse(img, (149, 112), (30, 75), 0, 0, 360, 15, -1)
        # Spine in the middle
        cv2.rectangle(img, (108, 20), (116, 204), 160, -1)
        # Rib lines
        for y in range(40, 200, 20):
            cv2.line(img, (40, y), (90, y + 10), 100, 2)
            cv2.line(img, (184, y), (134, y + 10), 100, 2)
            
    elif category == "skull":
        # Large rounded head outline
        cv2.circle(img, (112, 112), 80, 180, 5)
        # Jaw/facial structure block
        cv2.ellipse(img, (112, 160), (50, 30), 0, 0, 180, 120, -1)
        # Inner sinus/cavities
        cv2.circle(img, (90, 100), 15, 20, -1)
        cv2.circle(img, (134, 100), 15, 20, -1)
        
    elif category == "spine":
        # Center spinal column
        cv2.rectangle(img, (102, 10), (122, 214), 60, -1)
        # Segmented vertebrae blocks
        for y in range(20, 210, 15):
            cv2.rectangle(img, (98, y), (126, y + 8), 170, -1)
            cv2.line(img, (90, y + 4), (134, y + 4), 100, 1)
            
    elif category == "teeth":
        # Lower jaw curve outline
        cv2.ellipse(img, (112, 160), (90, 50), 0, 180, 360, 110, 4)
        # Teeth crowns
        for x in range(40, 190, 12):
            cv2.rectangle(img, (x, 100), (x + 8, 115), 220, -1)
            cv2.rectangle(img, (x, 125), (x + 8, 140), 220, -1)
            
    elif category == "hand":
        # Palm base
        cv2.ellipse(img, (112, 160), (40, 30), 0, 0, 360, 130, -1)
        # Five fingers branching outwards
        cv2.line(img, (112, 130), (112, 40), 150, 4) # Middle
        cv2.line(img, (92, 135), (80, 50), 140, 4)  # Index
        cv2.line(img, (72, 145), (50, 70), 120, 4)  # Pinky
        cv2.line(img, (132, 135), (144, 50), 140, 4) # Ring
        cv2.line(img, (148, 155), (180, 110), 130, 4) # Thumb
        
    elif category == "wrist":
        # Two parallel bones (radius/ulna)
        cv2.line(img, (100, 224), (100, 112), 150, 8)
        cv2.line(img, (124, 224), (124, 112), 150, 6)
        # Carpal bone clusters
        for cy in range(95, 110, 6):
            for cx in range(95, 130, 7):
                cv2.circle(img, (cx, cy), 4, 180, -1)
        # Metacarpals starting
        for x in range(85, 140, 12):
            cv2.line(img, (x, 90), (x, 10), 140, 5)
            
    elif category == "elbow":
        # Upper humerus
        cv2.line(img, (112, 0), (112, 100), 160, 14)
        # Lower radius and ulna branching down
        cv2.line(img, (100, 120), (80, 224), 150, 9)
        cv2.line(img, (124, 120), (144, 224), 140, 7)
        # Elbow joint cap
        cv2.circle(img, (112, 110), 15, 180, -1)
        
    elif category == "shoulder":
        # Shoulder joint socket
        cv2.circle(img, (150, 112), 20, 120, -1)
        # Humerus head meeting socket
        cv2.ellipse(img, (110, 140), (25, 15), 45, 0, 360, 160, -1)
        cv2.line(img, (110, 140), (60, 224), 160, 12)
        # Clavicle bone running top left
        cv2.line(img, (150, 100), (30, 40), 180, 6)
        
    elif category == "hip":
        # Two large pelvic circular wings
        cv2.circle(img, (60, 112), 45, 140, 6)
        cv2.circle(img, (164, 112), 45, 140, 6)
        # Center sacrum block
        cv2.rectangle(img, (102, 80), (122, 160), 160, -1)
        # Femur bone heads on outer edges
        cv2.circle(img, (35, 140), 12, 170, -1)
        cv2.circle(img, (189, 140), 12, 170, -1)
        cv2.line(img, (35, 140), (20, 224), 150, 10)
        cv2.line(img, (189, 140), (204, 224), 150, 10)
        
    elif category == "knee":
        # Upper femur shaft
        cv2.line(img, (112, 0), (112, 90), 170, 14)
        # Lower tibia shaft
        cv2.line(img, (112, 134), (112, 224), 160, 12)
        # Patella circular shadow in joint gap
        cv2.circle(img, (112, 112), 15, 120, -1)
        cv2.line(img, (90, 90), (134, 90), 180, 2)
        cv2.line(img, (90, 134), (134, 134), 180, 2)
        
    elif category == "leg":
        # Single solid thick bone running vertically
        cv2.line(img, (112, 0), (112, 224), 165, 18)
        # Subtle parallel thin fibula line
        cv2.line(img, (132, 0), (132, 224), 130, 4)
        
    elif category == "ankle":
        # Vertical tibia/fibula
        cv2.line(img, (112, 0), (112, 140), 160, 12)
        cv2.line(img, (128, 0), (128, 140), 130, 4)
        # Talus / joint junction
        cv2.circle(img, (115, 150), 12, 170, -1)
        # Horizontal calcaneus/foot block
        cv2.ellipse(img, (115, 175), (45, 20), 15, 0, 360, 150, -1)
        
    elif category == "foot":
        # Foot baseline horizontal arch
        cv2.ellipse(img, (130, 150), (60, 20), -10, 0, 360, 140, -1)
        # Toes branching on right side
        for y in range(125, 165, 8):
            cv2.line(img, (190, y), (215, y + 2), 130, 3)
            
    elif category == "ribs":
        # Multiple curved horizontal rib cage bones
        for y in range(20, 210, 15):
            cv2.ellipse(img, (112, y), (100, 30), 0, 180, 360, 120, 3)
            
    # Apply standard medical image blur and noise
    img = cv2.GaussianBlur(img, (7, 7), 0)
    return img

class MedicalDataset(Dataset):
    def __init__(self, sample_dir: str, num_synthetic_per_class: int = 60):
        self.samples = []
        self.transform = transforms.Compose([
            transforms.RandomRotation(15),
            transforms.RandomHorizontalFlip(),
            transforms.ColorJitter(brightness=0.2, contrast=0.2),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        # 1. Content-hash mapping of the 13 clinical sample files
        # Map filenames or hashes to the 14 CLASSES list indices
        sample_classes = {
            '101.jpeg': 'hand',
            '102.jpg': 'chest',
            '103.jpg': 'chest',
            '104.jpg': 'chest',
            '105.png': 'knee',
            '106.jpeg': 'ribs',
            '107.jpg': 'elbow',
            '108.jpeg': 'hand',
            '109.jpg': 'spine',
            '110.jpg': 'teeth',
            '111.jpg': 'chest',
            '112.jpeg': 'skull',
            '113.jpeg': 'ankle',
        }
        
        # Load real images
        if os.path.exists(sample_dir):
            for fn, label in sample_classes.items():
                fp = os.path.join(sample_dir, fn)
                if os.path.exists(fp):
                    img = cv2.imread(fp)
                    if img is not None:
                        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                        # Resize to standard size
                        img_resized = cv2.resize(img_rgb, (224, 224))
                        class_idx = CLASSES.index(label)
                        self.samples.append((img_resized, class_idx))
                        
        # 2. Add balanced synthetic images for all 14 classes
        for label in CLASSES:
            class_idx = CLASSES.index(label)
            for _ in range(num_synthetic_per_class):
                gray = generate_synthetic_xray(label)
                # Convert to RGB (3 channels) for ResNet input
                rgb = cv2.cvtColor(gray, cv2.COLOR_GRAY2RGB)
                self.samples.append((rgb, class_idx))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img_np, label = self.samples[idx]
        pil_img = Image.fromarray(img_np)
        tensor = self.transform(pil_img)
        return tensor, label

def train_model():
    sample_dir = "/Users/chaitanyakailasnagpure/Documents/Enterprise Medical Image Diagnosis AI Platform/Xray sample files"
    print("Preparing medical dataset...")
    dataset = MedicalDataset(sample_dir, num_synthetic_per_class=80)
    dataloader = DataLoader(dataset, batch_size=32, shuffle=True)
    
    print(f"Dataset prepared. Total training samples: {len(dataset)}")
    
    # Set up ResNet-18 structure
    model = models.resnet18(pretrained=False)
    model.fc = nn.Linear(model.fc.in_features, len(CLASSES))
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = model.to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    
    model.train()
    epochs = 10
    print("Starting training of ResNet-18 anatomical classifier...")
    for epoch in range(epochs):
        running_loss = 0.0
        correct = 0
        total = 0
        for inputs, labels in dataloader:
            inputs, labels = inputs.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * inputs.size(0)
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
        epoch_loss = running_loss / total
        epoch_acc = correct / total
        print(f"Epoch {epoch+1}/{epochs} - Loss: {epoch_loss:.4f} | Accuracy: {epoch_acc:.4f}")
        
    # Save the model
    save_path = "/Users/chaitanyakailasnagpure/Documents/Enterprise Medical Image Diagnosis AI Platform/backend/app/ml/classifier.pth"
    torch.save(model.state_dict(), save_path)
    print(f"Model trained successfully and weights saved to {save_path}")

if __name__ == '__main__':
    train_model()
