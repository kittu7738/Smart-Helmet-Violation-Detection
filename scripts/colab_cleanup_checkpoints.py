import os
import glob
import argparse

def format_size(size_bytes):
    return f"{size_bytes / (1024*1024):.2f} MB"

def main():
    parser = argparse.ArgumentParser(description="Clean up intermediate checkpoints.")
    parser.add_argument('--work-dir', default='/content/drive/MyDrive/Smart-Helmet-Violation-Detection/work_dirs',
                        help='Path to the work_dirs directory in Google Drive')
    parser.add_argument('--confirm', action='store_true', help='Actually delete the files. Otherwise just dry-run.')
    args = parser.parse_args()

    work_dir = args.work_dir
    
    if not os.path.exists(work_dir):
        print(f"Directory {work_dir} does not exist.")
        return

    all_pths = glob.glob(os.path.join(work_dir, '**', '*.pth'), recursive=True)
    
    to_delete = []
    preserved = []
    
    # Keywords that indicate a file should NOT be deleted
    preserve_keywords = ['best', 'latest', 'swin', 'baseline', 'j8', 'j9']
    
    for pth in all_pths:
        filename = os.path.basename(pth).lower()
        
        # Check if it should be preserved
        should_preserve = False
        for kw in preserve_keywords:
            if kw in filename:
                should_preserve = True
                break
        
        # We target specifically epoch_X.pth where X is a number
        if filename.startswith('epoch_') and not should_preserve:
            to_delete.append(pth)
        else:
            preserved.append(pth)

    print("==================================================")
    print("  CHECKPOINT CLEANUP AUDIT")
    print("==================================================")
    
    print("\n[PRESERVED FILES] (Baseline, Best, Latest, J8/J9)")
    for p in preserved:
        print(f"  KEEP: {os.path.relpath(p, work_dir)}")
        
    print(f"\n[OBSOLETE INTERMEDIATE CHECKPOINTS TO DELETE]")
    total_freed = 0
    for p in to_delete:
        size = os.path.getsize(p)
        total_freed += size
        print(f"  DELETE: {os.path.relpath(p, work_dir)} ({format_size(size)})")
        
    print("--------------------------------------------------")
    print(f"Total files targeted for deletion: {len(to_delete)}")
    print(f"Total space to free: {format_size(total_freed)}")
    print(f"Total files preserved: {len(preserved)}")
    
    if args.confirm:
        print("\n[ACTION] DELETING FILES...")
        for p in to_delete:
            os.remove(p)
        print("Done. Files deleted.")
        
        # Try to show remaining drive space (Linux/Colab specific)
        try:
            statvfs = os.statvfs(work_dir)
            free_space = statvfs.f_frsize * statvfs.f_bavail
            print(f"Remaining Drive Space: {format_size(free_space)}")
        except Exception:
            pass
    else:
        print("\n[DRY RUN] No files were actually deleted. Run with --confirm to delete.")
        print("Please review the list above and verify it matches the cleanup requirements.")

if __name__ == '__main__':
    main()
