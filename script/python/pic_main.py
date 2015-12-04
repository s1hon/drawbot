# coding=utf-8
import numpy as np
import cv2, json, math, sys
import converter.gcode_converter as gc
np.set_printoptions(threshold='nan')

res_imgo = cv2.imread('user-pic/'+ sys.argv[1] +'.png')
imgo, imgGray, imgHls = gc.remove_background(res_imgo)

ranges = gc.GetFaceRange(imgo,imgGray)
maskHair, maskFace = gc.GetImgMask(imgHls, ranges)
points = gc.Color_InRange_Searcher(maskHair, maskFace)
points = gc.line_optimization(points)
gc.gcode_generator(points)



# # ============================================================
# # Show the img

# while(1):
	
# 	cv2.imshow('原始圖片', res_imgo )
# 	cv2.imshow('去背結果', imgo )
# 	cv2.imshow('頭髮遮罩', maskHair )
# 	cv2.imshow('臉部遮罩', maskFace )
	
# 	k = cv2.waitKey(0)
# 	if k==27:
# 		break

# cv2.destroyAllWindows()