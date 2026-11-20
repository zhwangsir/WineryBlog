---
title: 计算机视觉入门：从像素到识别
category: 人工智能
order: 16
tags: [计算机视觉, CNN, 目标检测, PyTorch]
summary: 卷积的直觉、CNN 经典架构演进、一个完整的图像分类项目——机器如何"看见"。
---

## 1. 图像即矩阵

RGB 图像 = 高×宽×3 的数字矩阵（0-255）。计算机视觉（CV）的全部问题：

> **从像素矩阵中提取出有意义的结构：边缘 → 纹理 → 形状 → 物体 → 语义。**

## 2. 卷积：CV 的第一性原理

**卷积核（kernel）**是个小窗口（如 3×3），在图上滑动做加权求和。一个核就是一个"特征探测器"：

```
边缘检测核:  [-1 0 1]      用它扫过图像 → 垂直边缘的地方输出大值
             [-1 0 1]
             [-1 0 1]
```

**CNN（卷积神经网络）的革命性想法**：让核里的权重**从数据里学出来**。浅层卷积自动学会检测边缘/角点，中层学会纹理/部件，深层学会物体整体——层级特征提取，全自动。

卷积三性质：
- **局部连接**：每个输出只看 3×3 邻域（符合视觉规律：近邻像素相关）
- **权值共享**：同一个核扫全图（猫在左上角和右下角都用同一个"猫耳探测器"）
- **平移不变**：物体挪个位置照样认得

## 3. CNN 架构演进五分钟

| 年代 | 网络 | 贡献 |
| --- | --- | --- |
| 1998 | LeNet | 卷积+池化+全连接的原型 |
| 2012 | **AlexNet** | ImageNet 夺冠，深度学习时代开启（GPU 训练） |
| 2015 | **ResNet** | 残差连接解决"深了训练不动"，能堆到 152 层 |
| 2020+ | **ViT** | Transformer 进场，把图切成 patch 当词处理 |

**ResNet 的残差连接**值得记：`输出 = F(x) + x`——让网络学"增量"而不是全量，梯度可以走捷径直通浅层，深度不再是诅咒。这个思想后来统治了所有深度架构（Transformer 里也有）。

## 4. 完整项目：猫狗分类器（PyTorch）

```python
import torch, torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

# 1) 数据：增强（翻转/裁剪）= 免费扩充数据集，防过拟合
transform = transforms.Compose([
    transforms.Resize((128, 128)),
    transforms.RandomHorizontalFlip(),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])
train_ds = datasets.ImageFolder("data/train", transform=transform)
train_dl = DataLoader(train_ds, batch_size=32, shuffle=True)

# 2) 模型：迁移学习 = 站在 ImageNet 的肩膀上
model = torchvision.models.resnet18(weights="IMAGENET1K_V1")
for p in model.parameters(): p.requires_grad = False     # 冻结主干
model.fc = nn.Linear(model.fc.in_features, 2)            # 只训练最后的分类头

# 3) 训练
device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)
opt = torch.optim.Adam(model.fc.parameters(), lr=1e-3)   # 只优化分类头
loss_fn = nn.CrossEntropyLoss()

for epoch in range(5):
    for x, y in train_dl:
        x, y = x.to(device), y.to(device)
        opt.zero_grad()
        loss = loss_fn(model(x), y)
        loss.backward()
        opt.step()
    print(f"epoch {epoch}: loss={loss.item():.4f}")

torch.save(model.state_dict(), "cats_dogs.pt")
```

**迁移学习**是 CV 实战的默认姿势：几百张图微调一个分类头，准确率就能到 95%+，训练时间几分钟。

## 4. CV 任务地图

| 任务 | 输出 | 代表模型 |
| --- | --- | --- |
| 分类 | 整图 → 标签 | ResNet / ViT |
| **目标检测** | 框 + 类别（多个） | YOLO 系列（实时）/ Faster R-CNN |
| 分割 | 像素级标签 | U-Net（医疗）/ SAM（分割一切） |
| 关键点 | 坐标点 | MediaPipe / OpenPose |
| OCR | 图 → 文字 | PaddleOCR（中文强） |

实战选型：目标检测先试 **YOLOv8**（ultralytics 库，三行代码训练+推理）；OCR 直接 **PaddleOCR**（中文识别开箱即用）。

## 5. 数据才是瓶颈

- **标注**：label-studio / CVAT 自建标注平台；小数据用 LabelMe 手画框
- **增强**：翻转、裁剪、色彩抖动、Mixup——穷人的数据扩充
- **脏数据**：标注错误比模型弱更致命——训练前抽样人审

## 6. 部署到生产

1. **导出**：`torch.onnx.export()` → ONNX 通用格式
2. **推理加速**：ONNX Runtime / TensorRT（NVIDIA 卡提升 2-5 倍）
3. **量化**：FP32 → INT8，模型缩小 4 倍速度翻倍（精度损失 <1%）
4. **服务化**：FastAPI 包一层（见站内 FastAPI 教程），图片进、JSON 出

## 延伸阅读

- 站内相关：《深度学习与 PyTorch 入门》《特征工程与模型评估》《Transformer 原理：从注意力到 GPT》
- 《CS231n》（斯坦福公开课，CV 最佳入门）
- ultralytics 官方文档（YOLOv8）
