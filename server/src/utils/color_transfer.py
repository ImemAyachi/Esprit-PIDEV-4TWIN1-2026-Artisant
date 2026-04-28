import sys
import cv2
import numpy as np

def color_transfer(source_path, target_path, output_path):
    # Load Source (User's Photo)
    source = cv2.imread(source_path)
    # Load Target (Pollinations AI Concept)
    target = cv2.imread(target_path)

    if source is None or target is None:
        print('Error loading images')
        return

    # Convert both to LAB color space
    source_lab = cv2.cvtColor(source, cv2.COLOR_BGR2LAB).astype("float32")
    target_lab = cv2.cvtColor(target, cv2.COLOR_BGR2LAB).astype("float32")

    # Compute statistics
    (lMeanSrc, lStdSrc) = (np.mean(source_lab[:,:,0]), np.std(source_lab[:,:,0]))
    (aMeanSrc, aStdSrc) = (np.mean(source_lab[:,:,1]), np.std(source_lab[:,:,1]))
    (bMeanSrc, bStdSrc) = (np.mean(source_lab[:,:,2]), np.std(source_lab[:,:,2]))

    (lMeanTar, lStdTar) = (np.mean(target_lab[:,:,0]), np.std(target_lab[:,:,0]))
    (aMeanTar, aStdTar) = (np.mean(target_lab[:,:,1]), np.std(target_lab[:,:,1]))
    (bMeanTar, bStdTar) = (np.mean(target_lab[:,:,2]), np.std(target_lab[:,:,2]))

    # Transfer statistics
    (l, a, b) = cv2.split(source_lab)
    l = ((l - lMeanSrc) * (lStdTar / lStdSrc)) + lMeanTar
    a = ((a - aMeanSrc) * (aStdTar / aStdSrc)) + aMeanTar
    b = ((b - bMeanSrc) * (bStdTar / bStdSrc)) + bMeanTar

    # Clip to valid [0, 255]
    l = np.clip(l, 0, 255)
    a = np.clip(a, 0, 255)
    b = np.clip(b, 0, 255)

    # Merge and convert back to BGR
    transfer = cv2.merge([l, a, b])
    transfer = transfer.astype("uint8")
    transfer_bgr = cv2.cvtColor(transfer, cv2.COLOR_LAB2BGR)
    
    # Enhance the structure a bit (Unsharp Masking for HDR "AI" feel)
    blur = cv2.GaussianBlur(transfer_bgr, (0, 0), 3)
    enhanced = cv2.addWeighted(transfer_bgr, 1.5, blur, -0.5, 0)

    cv2.imwrite(output_path, enhanced)
    print("SUCCESS")

if __name__ == "__main__":
    color_transfer(sys.argv[1], sys.argv[2], sys.argv[3])
