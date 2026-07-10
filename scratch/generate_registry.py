import os
import re
import json

index_path = "my-video/src/compositions/layouts/index.ts"
templates_dir = "my-video/src/compositions/layouts/templates"
editor_path = "frontend/src/components/StoryboardEditor.jsx"

def to_camel_case(name):
    name = re.sub(r'[^a-zA-Z0-9\s-]', '', name)
    words = re.split(r'[\s\-_]+', name)
    return words[0].lower() + "".join(word.capitalize() for word in words[1:])

def to_pascal_case(name):
    name = re.sub(r'[^a-zA-Z0-9\s-]', '', name)
    words = re.split(r'[\s\-_]+', name)
    return "".join(word.capitalize() for word in words)

FAMILY_DESCRIPTIONS = {
    "opening": "Khung xương layout dạng Card/Tiêu đề Opening phong cách YupVid.",
    "list": "Khung xương layout dạng Danh sách List-Step phong cách YupVid.",
    "quote": "Khung xương layout dạng Trích dẫn Quote-Insight phong cách YupVid.",
    "media": "Khung xương layout dạng Đồ họa/Hình ảnh Media phong cách YupVid.",
    "comparison": "Khung xương layout dạng Đối đầu/So sánh Comparison phong cách YupVid.",
    "data": "Khung xương layout dạng Chỉ số/Số liệu Data-Metrics phong cách YupVid.",
    "timeline": "Khung xương layout dạng Dòng thời gian Timeline phong cách YupVid.",
    "ending": "Khung xương layout dạng Kết thúc Ending/Outro phong cách YupVid."
}

# Mapping families to frontend dropdown categories
FAMILY_TO_DROPDOWN_KEY = {
    "opening": "Opening / Headline",
    "list": "List / Steps",
    "data": "Data / Metrics",
    "comparison": "Comparison / Table",
    "quote": "Quote / Insight",
    "timeline": "Timeline",
    "media": "Media",
    "ending": "Ending"
}

# Hand-coded initial lists
dropdown_layouts = {
    "Opening / Headline": [
        {"value": "Hero", "label": "Hero Title"},
        {"value": "IntroBriefingCard", "label": "Intro Briefing Card"},
        {"value": "Terminal", "label": "Terminal Console"},
        {"value": "Quote", "label": "Quote Insight"},
        {"value": "IntroChapterStack", "label": "Intro Chapter Stack Image"}
    ],
    "List / Steps": [
        {"value": "Feature Grid", "label": "Bento Feature Grid"},
        {"value": "Three Columns", "label": "Three Pricing Cards"}
    ],
    "Data / Metrics": [
        {"value": "Dashboard", "label": "Stats Dashboard"},
        {"value": "Stats Banner", "label": "SaaS Live Chart"}
    ],
    "Comparison / Table": [
        {"value": "Comparison", "label": "Versus Arena Split"}
    ],
    "Quote / Insight": [
        {"value": "Quote", "label": "Quote Insight"}
    ],
    "Timeline": [
        {"value": "Timeline", "label": "Staggered Pill Timeline"}
    ],
    "Media": [
        {"value": "Split Screen", "label": "Split Screen Media"},
        {"value": "Gallery", "label": "3D Glass Stack Gallery"},
        {"value": "Laptop Mockup", "label": "Double Device Mockup"},
        {"value": "Integration Cloud", "label": "Integration Cloud Graph"}
    ],
    "Ending": [
        {"value": "Ending", "label": "Ending / CTA Screen"}
    ]
}

# Collect all json files
json_imports = []
json_registrations = []

for root, dirs, files in os.walk(templates_dir):
    for file in files:
        if not file.endswith('.json'):
            continue
            
        file_path = os.path.join(root, file)
        rel_path = os.path.relpath(file_path, os.path.dirname(index_path)).replace("\\", "/")
        if not rel_path.startswith("./") and not rel_path.startswith("../"):
            rel_path = "./" + rel_path
            
        base_name = os.path.splitext(file)[0]
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            layout_id = data.get("id", to_pascal_case(base_name))
            layout_name = data.get("name", base_name)
            family = data.get("family", "opening")
            
            # Form clean import variable
            import_var = to_camel_case(base_name) + "Json"
            if base_name == "intro_chapter_stack":
                # Special casing matching the existing template
                import_var = "introChapterStackJson"
                layout_id = "IntroChapterStack"
                
            json_imports.append(f'import {import_var} from "{rel_path}";')
            
            # Skip registering IntroChapterStack since it is handcoded
            if layout_id != "IntroChapterStack":
                desc = FAMILY_DESCRIPTIONS.get(family, "Khung xương layout phong cách YupVid.")
                
                # Format layout registry entry
                entry = f"""  {layout_id}: {{
    id: "{layout_id}",
    name: "{layout_name}",
    family: "{family}",
    component: (props) => React.createElement(TemplateLayout, {{ ...props, templateJson: {import_var} }}),
    templateJson: {import_var},
    description: "{desc}"
  }}"""
                json_registrations.append((layout_id, entry))
                
                # Add to frontend dropdown category
                dropdown_key = FAMILY_TO_DROPDOWN_KEY.get(family)
                if dropdown_key:
                    # Prevent duplicates
                    if not any(d["value"] == layout_id for d in dropdown_layouts[dropdown_key]):
                        dropdown_layouts[dropdown_key].append({"value": layout_id, "label": layout_name})
                        
        except Exception as e:
            print(f"Error reading JSON {file_path}: {e}")

# Sort imports
json_imports.sort()

# Rebuild index.ts
ts_content = """import React from "react";
import { LayoutProps } from "./LayoutTypes";

// Custom Layout components imports
import { HeroLayout } from "./opening/HeroLayout";
import { IntroBriefingCardLayout } from "./opening/IntroBriefingCardLayout";
import { SplitScreenLayout } from "./media/SplitScreenLayout";
import { FeatureGridLayout } from "./list/FeatureGridLayout";
import { TimelineLayout } from "./timeline/TimelineLayout";
import { ComparisonLayout } from "./comparison/ComparisonLayout";
import { DashboardLayout } from "./data/DashboardLayout";
import { GalleryLayout } from "./media/GalleryLayout";
import { LaptopMockupLayout } from "./media/LaptopMockupLayout";
import { StatsBannerLayout } from "./data/StatsBannerLayout";
import { ThreeColumnsLayout } from "./list/ThreeColumnsLayout";
import { IntegrationCloudLayout } from "./media/IntegrationCloudLayout";
import { QuoteLayout } from "./quote/QuoteLayout";
import { EndingLayout } from "./ending/EndingLayout";
import { TemplateLayout } from "./TemplateLayout";

// Auto-generated JSON layout templates imports
"""

ts_content += "\n".join(json_imports) + "\n\n"

ts_content += """// Re-export type and helpers
export * from "./LayoutTypes";
export { BrowserMockup } from "./LayoutHelpers";

// Re-export layouts
export { HeroLayout } from "./opening/HeroLayout";
export { IntroBriefingCardLayout } from "./opening/IntroBriefingCardLayout";
export { SplitScreenLayout } from "./media/SplitScreenLayout";
export { FeatureGridLayout } from "./list/FeatureGridLayout";
export { TimelineLayout } from "./timeline/TimelineLayout";
export { ComparisonLayout } from "./comparison/ComparisonLayout";
export { DashboardLayout } from "./data/DashboardLayout";
export { GalleryLayout } from "./media/GalleryLayout";
export { LaptopMockupLayout } from "./media/LaptopMockupLayout";
export { StatsBannerLayout } from "./data/StatsBannerLayout";
export { ThreeColumnsLayout } from "./list/ThreeColumnsLayout";
export { IntegrationCloudLayout } from "./media/IntegrationCloudLayout";
export { QuoteLayout } from "./quote/QuoteLayout";
export { EndingLayout } from "./ending/EndingLayout";
export { TemplateLayout } from "./TemplateLayout";

export interface LayoutMetadata {
  id: string;
  name: string;
  family: "opening" | "list" | "data" | "comparison" | "quote" | "timeline" | "media" | "ending";
  component: React.FC<LayoutProps>;
  description: string;
  templateJson?: any;
}

export const LAYOUT_REGISTRY: Record<string, LayoutMetadata> = {
  // Existing custom hand-coded layouts
  Hero: {
    id: "Hero",
    name: "Hero Title",
    family: "opening",
    component: HeroLayout,
    description: "Tiêu đề chính lớn cùng mô tả ngắn đầy ấn tượng mở đầu video."
  },
  IntroBriefingCard: {
    id: "IntroBriefingCard",
    name: "Intro Briefing Card",
    family: "opening",
    component: IntroBriefingCardLayout,
    description: "Mở đầu dạng thẻ kính mờ tóm tắt ý chính nổi bật đè lên các chữ lớn mờ nền sau."
  },
  SplitScreen: {
    id: "SplitScreen",
    name: "Split Screen",
    family: "media",
    component: SplitScreenLayout,
    description: "Chia đôi 50/50: Bên trái ảnh trình duyệt mockup, bên phải các ý chính."
  },
  FeatureGrid: {
    id: "FeatureGrid",
    name: "Feature Grid",
    family: "list",
    component: FeatureGridLayout,
    description: "Bố cục lưới Bento Box hiển thị trực quan các đặc điểm/chức năng nổi bật."
  },
  Timeline: {
    id: "Timeline",
    name: "Timeline Steps",
    family: "timeline",
    component: TimelineLayout,
    description: "Dòng thời gian so le nảy viên thuốc có đường nối đứt đoạn."
  },
  Comparison: {
    id: "Comparison",
    name: "Versus Comparison",
    family: "comparison",
    component: ComparisonLayout,
    description: "Hai cột đối đầu so sánh Ưu/Nhược điểm với huy hiệu VS nổi ở trung tâm."
  },
  Dashboard: {
    id: "Dashboard",
    name: "Stats Dashboard",
    family: "data",
    component: DashboardLayout,
    description: "Hiển thị các chỉ số/số liệu quan trọng dưới dạng lưới."
  },
  Gallery: {
    id: "Gallery",
    name: "3D Glass Stack",
    family: "media",
    component: GalleryLayout,
    description: "Chồng thẻ kính mờ 3D xoay chiều sâu chiều ngang nghệ thuật."
  },
  LaptopMockup: {
    id: "LaptopMockup",
    name: "Double Device Mock",
    family: "media",
    component: LaptopMockupLayout,
    description: "Hiển thị song song mockup Laptop và Điện thoại đè chồng lên nhau."
  },
  StatsBanner: {
    id: "StatsBanner",
    name: "SaaS Live Chart",
    family: "data",
    component: StatsBannerLayout,
    description: "Tiêu đề bên trái, bên phải là bảng số liệu và đồ thị dạng sóng SVG live."
  },
  ThreeColumns: {
    id: "ThreeColumns",
    name: "Three Pricing Cards",
    family: "list",
    component: ThreeColumnsLayout,
    description: "So sánh 3 gói dịch vụ/tính năng theo dạng thẻ giá bán đối sánh dọc."
  },
  IntegrationCloud: {
    id: "IntegrationCloud",
    name: "API Graph Node",
    family: "media",
    component: IntegrationCloudLayout,
    description: "Mạng lưới kết nối API với các node xung quanh bắn tín hiệu chạy dọc."
  },
  Quote: {
    id: "Quote",
    name: "Quote Insight",
    family: "quote",
    component: QuoteLayout,
    description: "Hiển thị trích dẫn lớn giữa màn hình kèm biểu tượng nháy kép phát sáng."
  },
  Ending: {
    id: "Ending",
    name: "Quiet Logo Mark",
    family: "ending",
    component: EndingLayout,
    description: "Kết thúc video nhẹ nhàng hiển thị logo và thông điệp thương hiệu."
  },
  IntroChapterStack: {
    id: "IntroChapterStack",
    name: "Intro Chapter Stack Image",
    family: "opening",
    component: (props) => React.createElement(TemplateLayout, { ...props, templateJson: introChapterStackJson }),
    templateJson: introChapterStackJson,
    description: "Khung xương layout dạng card chồng 3D nghiêng phong cách YupVid."
  },

  // Auto-generated skeleton layouts
"""

# Sort registrations by ID for clean code
json_registrations.sort(key=lambda x: x[0])
registration_blocks = [x[1] for x in json_registrations]

ts_content += ",\n".join(registration_blocks)

ts_content += """
};

export const getLayoutById = (id: string): LayoutMetadata => {
  const cleanId = id.trim().replace(/\s+/g, "");
  // Find layout ignoring space formatting
  const match = Object.keys(LAYOUT_REGISTRY).find(
    (key) => key.toLowerCase() === cleanId.toLowerCase()
  );
  return match ? LAYOUT_REGISTRY[match] : LAYOUT_REGISTRY.Hero;
};
"""

with open(index_path, 'w', encoding='utf-8') as f:
    f.write(ts_content)

# Update StoryboardEditor.jsx
with open(editor_path, 'r', encoding='utf-8') as f:
    editor_content = f.read()

# Build LAYOUTS_BY_FAMILY string
dropdown_blocks = []
for category, items in dropdown_layouts.items():
    items_sorted = sorted(items, key=lambda x: x["label"])
    items_str = ",\n".join([f'    {{ value: "{it["value"]}", label: "{it["label"]}" }}' for it in items_sorted])
    dropdown_blocks.append(f'  "{category}": [\n{items_str}\n  ]')

dropdown_replacement = "const LAYOUTS_BY_FAMILY = {\n" + ",\n".join(dropdown_blocks) + "\n};"

# Replace the block in editor_content
pattern = r'const LAYOUTS_BY_FAMILY = \{.*?\};'
updated_editor_content = re.sub(pattern, dropdown_replacement, editor_content, flags=re.DOTALL)

with open(editor_path, 'w', encoding='utf-8') as f:
    f.write(updated_editor_content)

print(f"Layout registry index.ts rebuilt with {len(json_registrations)} layouts!")
print(f"StoryboardEditor.jsx updated successfully with complete layout categories!")
