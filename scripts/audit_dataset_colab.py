import json
import os
import argparse
from collections import defaultdict

def audit_split(json_path, split_name):
    if not os.path.exists(json_path):
        print(f"[!] Warning: {json_path} not found.")
        return

    with open(json_path, 'r') as f:
        data = json.load(f)

    images = {img['id']: img for img in data['images']}
    categories = {cat['id']: cat['name'] for cat in data['categories']}
    
    cat_counts = defaultdict(int)
    img_has_cat = defaultdict(set)
    box_areas = defaultdict(list)
    
    issues = []

    for ann in data['annotations']:
        cat_id = ann['category_id']
        img_id = ann['image_id']
        cat_name = categories.get(cat_id, f"Unknown-{cat_id}")
        
        cat_counts[cat_name] += 1
        img_has_cat[cat_name].add(img_id)
        
        bbox = ann.get('bbox', [0, 0, 0, 0])
        x, y, w, h = bbox
        area = w * h
        box_areas[cat_name].append(area)

        # Check for zero/negative width/height
        if w <= 0 or h <= 0:
            issues.append({'image_id': img_id, 'ann_id': ann['id'], 'issue': 'Zero or negative box width/height', 'bbox': bbox})
        
        # Check if outside image
        if img_id in images:
            img = images[img_id]
            if x < 0 or y < 0 or (x + w) > img['width'] or (y + h) > img['height']:
                issues.append({'image_id': img_id, 'ann_id': ann['id'], 'issue': 'Box out of image bounds', 'bbox': bbox})

    print(f"\n==================================================")
    print(f" AUDIT: {split_name} ({len(images)} images, {len(data['annotations'])} annotations)")
    print(f"==================================================")
    print("Class Distribution (Instances):")
    for cat_name, count in sorted(cat_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  - {cat_name}: {count} (in {len(img_has_cat[cat_name])} unique images)")
        
    print("\nBounding Box Area Averages:")
    for cat_name, areas in sorted(box_areas.items(), key=lambda x: x[0]):
        avg_area = sum(areas) / len(areas) if areas else 0
        print(f"  - {cat_name}: Avg Area {avg_area:.1f} pixels^2")

    if issues:
        print(f"\n[WARNING] Found {len(issues)} problematic annotations!")
        for issue in issues[:10]: # Print top 10
            print(f"  -> Img {issue['image_id']}, Ann {issue['ann_id']}: {issue['issue']} (Box: {issue['bbox']})")
        if len(issues) > 10:
            print("  ... and more.")
    else:
        print("\n[OK] No zero/negative/out-of-bounds bounding boxes detected.")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data-root', default='/content/dataset_local')
    args = parser.parse_args()
    
    print(f"Auditing Dataset at: {args.data_root}")
    
    audit_split(os.path.join(args.data_root, 'train/instances_train.json'), 'TRAIN')
    audit_split(os.path.join(args.data_root, 'val/instances_val.json'), 'VALIDATION')
    audit_split(os.path.join(args.data_root, 'test/instances_test.json'), 'TEST')

if __name__ == '__main__':
    main()
