# coding=utf-8
import numpy as np
import cv2, json, math, sys
import converter.gcode_converter as gc

ranges = [[11,60],[80,120]]

imgo = cv2.imread('user-pic/'+ sys.argv[1] +'.png')
imgo, imgGray, imgHsv, imgHls = gc.remove_background(imgo)

ranges = gc.GetFaceHSV_HairColor(imgo,imgGray)
points = gc.Color_InRange_Searcher(imgGray,imgHsv, imgHls, ranges)

points = gc.line_optimization(points)
gc.gcode_generator(points)


# To be done - Smoothening the edges
# cv2.namedWindow('image', cv2.WINDOW_NORMAL)
# mask = cv2.cvtColor(imgo, cv2.COLOR_BGR2HLS)

# while(1):
# 	cv2.imshow('image', mask )

# 	k = cv2.waitKey(0)
# 	if k==27:
# 		break

# cv2.destroyAllWindows()