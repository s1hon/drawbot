# coding=utf-8
import numpy as np
import cv2, json, math, sys
import converter.gcode_converter as gc

ranges = [[11,60],[80,120]]

res_imgo = cv2.imread('user-pic/'+ sys.argv[1] +'.png')
imgo, imgGray, imgHsv, imgHls = gc.remove_background(res_imgo)

ranges = gc.GetFaceHSV_HairColor(imgo,imgGray)
# points = gc.Color_InRange_Searcher(imgGray,imgHsv, imgHls, ranges)

# points = gc.line_optimization(points)
# gc.gcode_generator(points)


# To be done - Smoothening the edges
Hl=0
Sl=0
Vl=0
Hu=180
Su=50
Vu=100

lower_hair = np.array( [Hl,Sl,Vl] )
upper_hair = np.array( [Hu,Su,Vu] )

lower_face = np.array( [ 0,ranges[1][1]-30,ranges[1][2]-30 ] )
upper_face = np.array( [ 180,ranges[1][1]+30,ranges[1][2]+30 ] )


hair = cv2.inRange(imgHls, lower_hair, upper_hair)
face = cv2.inRange(imgHls, lower_face, upper_face)


while(1):
	cv2.imshow('原始圖片', res_imgo )
	cv2.imshow('去背結果', imgo )
	cv2.imshow('HLS', imgHls )
	cv2.imshow('頭髮遮罩', hair )
	cv2.imshow('HSV', imgHsv )
	cv2.imshow('臉部遮罩', face )

	k = cv2.waitKey(0)
	if k==27:
		break

cv2.destroyAllWindows()