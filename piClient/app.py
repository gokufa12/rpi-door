#from socketIO_client import SocketIO, BaseNamespace, LoggingNamespace
#import logging
#logging.getLogger('socketIO-client').setLevel(logging.DEBUG)
#logging.basicConfig()

import configparser
import time
import RPi.GPIO as GPIO

#Set up gpio pins
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
redPin = 17
doorPin = 23
GPIO.setup(redPin, GPIO.OUT)
GPIO.setup(doorPin, GPIO.IN, pull_up_down=GPIO.PUD_UP)

#get config info
config = configparser.ConfigParser()
config.read('settings.conf')
settings = config['DEFAULT']

roomName = settings['RoomName']
print('hello')
print roomName
address = settings['Server']
print address
port = settings['ServerPort']
print port
timeout = 5  # settings['WarningTimeout'] 

#import socket
#import sys
#
## Create a TCP/IP socket
#sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
#
## Connect the socket to the port where the server is listening
#server_address = ('localhost', 6969)
#print >>sys.stderr, 'connecting to %s port %s' % server_address
#sock.connect(server_address)
#
#try:
#
#  # Send data
#  message = 'This is the message.  It will be repeated.'
#  print >>sys.stderr, 'sending "%s"' % message
#  sock.sendall(message)
#
#  # Look for the response
#  amount_received = 0
#  amount_expected = len(message)
#
#  while amount_received < amount_expected:
#    data = sock.recv(16)
#    amount_received += len(data)
#  print >>sys.stderr, 'received "%s"' % data


  #set up socket
  #class RoomNamespace(BaseNamespace):
  #  def on_connect():
  #    print('connnect')
  #    # send register message
  #    self.emit('register',roomName)
  #
  #  def on_disconnect():
  #    print('disconnected')
  #    # do I need to do anything here?
  #
  #  def on_reconnect():
  #    print('reconnect')
  #    # resend register message
  #    self.emit('register',roomName)
  #
  #socketIO = SocketIO(address, port, LoggingNamespace)
  #socketIO.wait()
  #room_namespace = socketIO.define(RoomNamespace, '/rooms')
  
#define statuses
open = 0
occupied = 1
overdue = 2

#set to 1 so we send intial status message
timeClosed = 1
blink = False

while(True):
  input_state = GPIO.input(doorPin)
  if(input_state == 1):
    if(timeClosed > 0):
      print('Reset time closed...')
      timeClosed = 0
      # send update that room is open
#       socket.sendall(room + '|' + open)
#      room_namespace.emit('update',open)
    GPIO.output(redPin, GPIO.LOW)
    print('Door open')
  else:
    if(timeClosed == 0):
      print('Room is now in use')
      # send an update that room is in use
#       socket.sendall(room + '|' + occupied)
#      room_namespace.emit('update',occupied)
    timeClosed += 1
    GPIO.output(redPin, GPIO.HIGH)
    print('Door closed')
  if(timeClosed >= timeout):
    print('Timeout')
    # send update that person has been here for a while
#     socket.sendall(room + '|' + overdue)
#    room_namespace.emit('update',overdue)

    #blink LED
    if(not blink):
      GPIO.output(redPin, GPIO.LOW)
    blink = not blink
  time.sleep(1)
#finally:
#  print >>sys.stderr, 'closing socket'
#  sock.close()
