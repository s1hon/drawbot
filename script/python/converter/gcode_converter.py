# coding=utf-8
import numpy as np
import cv2
import json
import math
import sys

def remove_background(imgo) :

	#Load the Image
	height, width = imgo.shape[:2]

	#Create a mask holder
	mask = np.zeros(imgo.shape[:2],np.uint8)

	#Grab Cut the object
	bgdModel = np.zeros((1,65),np.float64)
	fgdModel = np.zeros((1,65),np.float64)

	#Hard Coding the Rect The object must lie within this rect.
	rect = (10,10,width-30,height-30)
	cv2.grabCut(imgo,mask,rect,bgdModel,fgdModel,5,cv2.GC_INIT_WITH_RECT)
	mask = np.where((mask==2)|(mask==0),0,1).astype('uint8')
	img1 = imgo*mask[:,:,np.newaxis]

	#Get the background
	background = imgo - img1

	#Change all pixels in the background that are not black to white
	background[np.where((background > [0,0,0]).all(axis = 2))] = [255,255,255]

	#Add the background and the image
	final = background + img1
	gray_pic = cv2.cvtColor(final, cv2.COLOR_BGR2GRAY)
	imghsv = cv2.cvtColor(final, cv2.COLOR_BGR2HSV)
	imghls = cv2.cvtColor(final, cv2.COLOR_BGR2HLS)

	return final, gray_pic, imghsv,imghls


def GetFaceHSV_HairColor(imgo, gray):

	# face_detection(gray)
	face_cascade = cv2.CascadeClassifier('script/python/haarcascade_frontalface_default.xml')
	faces = face_cascade.detectMultiScale(gray, 1.3, 3)

	height, width = gray.shape[:2]

	# ============================================================
	# Get FaceColorHSV

	counter = [0] * 256
	maxCounter = 0
	maxCounter_color = None

	# Counting color
	for (x,y,w,h) in faces:
		for x1 in range(y,y+w):
			for y1 in range(x,x+h):
				color = gray[x1-1][y1-1]
				counter[color] = counter[color] + 1

	# Find max color 0-254
	for color in range(0,255) :
		if  counter[color] > maxCounter :
			maxCounter = counter[color]
			maxCounter_color = color

	# Find color on gray & use bgr2hsv on imgo point
	FaceHsv = FindfaceColor(imgo, gray, maxCounter_color, faces)
	print '(',FaceHsv,')'

	# ============================================================
	# Get Hair GRB

	counter = [0] * 256
	maxCounter = 0
	maxCounter_color = None

	# Counting color
	for (x,y,w,h) in faces:
		for x1 in range(y,y+w):
			for y1 in range(x,x/2,-1):
				color = gray[x1-1][y1-1]
				counter[color] = counter[color] + 1

	# Find max color 0-254
	for color in range(0,255) :
		if  counter[color] > maxCounter :
			maxCounter = counter[color]
			maxCounter_color = color

	HairHsl = FindhairColor(imgo, gray, maxCounter_color, faces)
	# print '(',HairHsl,')'

	ranges = [HairHsl,FaceHsv]
	return ranges


def FindfaceColor(imgo, gray, color, faces):

	# Find color on gray & use bgr2hsv on imgo point
	for (x,y,w,h) in faces:
		for x1 in range(y,y+w):
			for y1 in range(x,x+h):
				if gray[x1-1][y1-1] == color :
					faceHsv = cv2.cvtColor(np.uint8([[ imgo[x1-1][y1-1] ]]),cv2.COLOR_BGR2HLS)
					return faceHsv[0][0]

def FindhairColor(imgo, gray, color, faces):
	for (x,y,w,h) in faces:
		for x1 in range(y,y+w):
			for y1 in range(x,x/2,-1):
				if gray[x1-1][y1-1] == color :
					HairHsl = cv2.cvtColor(np.uint8([[ imgo[x1-1][y1-1] ]]),cv2.COLOR_BGR2HLS)
					return HairHsl[0][0]

def Color_InRange_Searcher(gray, imgHsv, imgHls, ranges) :

	height, width = gray.shape[:2]
	#height -> 240 
	#width -> 320


	# Hair
	Hair=ranges[0]
	Face=ranges[1]

	point = []
	HLS_tmp = []
	HSV_tmp = []
	counter = [None] * 256

	# 將範圍中的點集合起來
	for x in range(0,height-1):
		for y in range(0,width-1):

			HLScolor = imgHls[x-1][y-1]
			HSVcolor = imgHsv[x-1][y-1]

			# HLS
			if HSLinRange(HLScolor,Hair) :
				HLS_tmp.append([x-1,y-1])

			# HSV
			if HSVinRange(HSVcolor,Face) :
				HSV_tmp.append([x-1,y-1])


	# point.append(HLS_tmp)
	point.append(HLS_tmp)
	point.append(HSV_tmp)

	return point

def HSVinRange(HSVcolor,Face):

	H=[Face[0]-10,Face[0]+10]
	S=[Face[1]-10,255]
	V=[60,255]

	if  H[0] <= HSVcolor[0] <= H[1] and S[0] <= HSVcolor[1] <= S[1] and V[0] <= HSVcolor[2] <= V[1]:
		return 1
	else:
		return 0

def HSLinRange(HSLcolor,Hair):

	H=[Hair[0]-10,Hair[0]+10]
	S=[Hair[1]-5,Hair[1]+5]
	L=[Hair[2]-6,Hair[2]+6]

	if  H[0] <= HSLcolor[0] <= H[1] and S[0] <= HSLcolor[1] <= S[1] and L[0] <= HSLcolor[2] <= L[1]:
		return 1
	else:
		return 0

def line_optimization(points):

	# 線條最佳化 
	# Old: 1-2-3-4-5  New: 1-5
	points_tmp = []
	for point in points:
		point_tmp = []
		tmp = 0
		id = 0 	
		while id < len(point):
			try :
				# when X on same line
				if point[id][0] == point[id+1][0] :
					point_tmp.append(point[id])
					try :
						while point[id+1][1]-point[id][1]==1 :
							tmp = point[id]
							id = id + 1
						else :
							point_tmp.append(point[id])
					except IndexError:
						point_tmp.append(point[id])
				# when X to next line
				else :
					point_tmp.append(point[id])
			except IndexError:
				point_tmp.append(point[id])
			id = id + 1
		points_tmp.append(point_tmp)
	return points_tmp


def search_best_line(end_point, points) :
	# 求最後一個end_point與每個點的距離，尋找最佳點
	best_point = []
	distance = 999 # Max distance

	for point in points :
		x1=float(end_point[0])
		y1=float(end_point[1])
		x2=float(point[0])
		y2=float(point[1])
		t_distance =  math.sqrt(math.pow(x1-x2,2) + math.pow(y1-y2,2))
		
		if t_distance < distance :
			distance = t_distance
			best_point = point

	return best_point

def gcode_generator(points) :

	# `7MM"""Yb.      db      `7MM"""Mq.  `7MMF' `YMM' 
	#   MM    `Yb.   ;MM:       MM   `MM.   MM   .M'   
	#   MM     `Mb  ,V^MM.      MM   ,M9    MM .d"     
	#   MM      MM ,M  `MM      MMmmdM9     MMMMM.     
	#   MM     ,MP AbmmmqMA     MM  YM.     MM  VMA    
	#   MM    ,dP'A'     VML    MM   `Mb.   MM   `MM.  
	# .JMMmmmdP'.AMA.   .AMMA..JMML. .JMM..JMML.   MMb. 暗
	print '$H'

	point = points[0]
	best_point = point[0]

	if len(point) %2 != 0 :
		point = point[:-1]
	
	while len(point) != 0 :

		id = point.index(best_point)
		
		# 偶數項 -> 奇數項
		if id % 2 == 0 :
			start_point = point[id]
			try:
				end_point = point[id+1]
			except IndexError:
				pass
		
		# 偶數項 <- 奇數項
		else :
			start_point = point[id]
			end_point = point[id-1]
			
		print 'G0 Z0'
		print 'G0 X-'+str(float(start_point[0])/4)+' Y-'+str(float(start_point[1])/4)
		print 'G0 Z0.26'
		print 'G0 X-'+str(float(end_point[0])/4)+' Y-'+str(float(end_point[1])/4)

		point.remove(start_point)
		point.remove(end_point)

		best_point=search_best_line(end_point,point)

	print 'G0 Z0'

	# `7MMF'      `7MMF' .g8"""bgd `7MMF'  `7MMF'MMP""MM""YMM 
	#   MM          MM .dP'     `M   MM      MM  P'   MM   `7 
	#   MM          MM dM'       `   MM      MM       MM      
	#   MM          MM MM            MMmmmmmmMM       MM      
	#   MM      ,   MM MM.    `7MMF' MM      MM       MM      
	#   MM     ,M   MM `Mb.     MM   MM      MM       MM      
	# .JMMmmmmMMM .JMML. `"bmmmdPY .JMML.  .JMML.   .JMML.    亮

	point = points[1]
	
	while len(point) != 0 :

		start_point = point[0]
		id = point.index(start_point)

		print 'G0 Z0'
		print 'G0 X-'+str(float(start_point[0])/4)+' Y-'+str(float(start_point[1])/4)
		print 'G0 Z0.26'

		point.remove(start_point)

		# 尋找有無最近的點
		while True :

			next_point = None
			distance = 999 # Max distance

			for p in point :
				t_distance = math.sqrt(math.pow(start_point[0]-p[0],2) + math.pow(start_point[1]-p[1],2))
				if t_distance < distance :
					distance = t_distance
					next_point = p
			
			if distance > 5 :
				break
			else :
				print 'X-'+str(float(next_point[0])/4)+' Y-'+str(float(next_point[1])/4)
				point.remove(next_point)
				start_point = next_point

	print 'G0 Z0'
	print 'G0 X0 Y0'