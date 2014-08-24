#!/usr/bin/env python
#
# Copyright 2007 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
import webapp2
from google.appengine.ext import ndb
import jinja2
import os
from google.appengine.api import users
from google.appengine.api import channel
jinja_environment = jinja2.Environment(loader=jinja2.FileSystemLoader(os.path.dirname(__file__)))

class MainHandler(webapp2.RequestHandler):
	def get(self):
		template_values = {}
		template = jinja_environment.get_template('main.html')
		self.response.out.write(template.render(template_values))

class GameHandler(webapp2.RequestHandler):
	def get(self):
		template_values = {}
		template = jinja_environment.get_template('mainboard.html')
		self.response.out.write(template.render(template_values))

class InstructHandler(webapp2.RequestHandler):
	def get(self):
		template_values = {}
		template = jinja_environment.get_template('instructions.html')
		self.response.out.write(template.render(template_values))

class AboutHandler(webapp2.RequestHandler):
	def get(self):
		template_values = {}
		template = jinja_environment.get_template('about.html')
		self.response.out.write(template.render(template_values))

class Game(db.Model):
	"""All the data for a game"""
	player1 = db.UserProperty()
	player2 = db.UserProperty()
	board = db.ListProperty()
	move1 = db.BooleanProperty() #True if Player 1's turn. use for win func
	movedPiece = db.StringProperty() #class of piece. may not need b/c previously selected
	tile = db.StringProperty() #id of tile 00 01, etc
	selectedPiece = db.StringProperty() #class of piece

class GameFromRequest():
	game = None
	def __init__(self, request):
		user = users.get_current_user()
		game_key = request.get('gamekey')
		if user and game_key:
			self.game = Game.get_by_key_name(game_key)
	def get_game(self):
		return self.game

class GameUpdater():
	game = None
	def __init__(self, game):
		self.game = game
	def get_game_message(self):
		gameUpdate = {
			'board' : self.game.board,
			'player1' : self.game.player1.user_id(),
			'player2' : '' if not self.game.player2 else self.game.player2.user_id(),
			'move1': self.game.move1,
			'tile' : '' if not self.game.tile,
			'movedPiece' : '' if not self.game.movedPiece, #don't necessarily need
			'selectedPiece' : '' if not self.game.selectedPiece
		}
		return gameUpdate #original used simplejson?
	def send_update(self):
		message = self.get_game_message()
		channel.send_message(self.game.player1.user_id() + self.game.key().id_or_name(), message)
		if self.game.player2:
			channel.send_message(self.game.player2.user_id() + self.game.key().id_or_name(), message)
	def make_move(self, rowcol, movedPiece, user):
		if user == self.game.player1 or user == self.game.player2:
				if self.game.move1 == (user == self.game.player1):
				row = rowcol[0]
				col = rowcol[1]
				self.game.board[row][col].append(movedPiece) #piece = class of piece, string
				
				self.game.put()

				#may put win func here
				self.send_update()
	def select_piece(self, selectedPiece):
		if user == self.game.player1 or user == self.game.player2:
			if self.game.move1 == (user == self.game.player1):
				self.game.selectedPiece = selectedPiece
				self.game.move1 = not self.game.move1
				self.game.put()
				self.send_update()


class MultiHandler(webapp2.RequestHandler):
	def get(self):
		user = users.get_current_user()
		if not user:
			self.redirect(users.create_login_url(self.request.uri))
			return
		game_key = self.request.get('gamekey')
		game = None
		if not game_key:
			# if not game specified, create new game, make this use player 1
			game_key = user.user_id()
			game = Game(key_name = game_key,
						player1 = user,
						move1 = True,
						board = [
								[[],[],[],[]],
								[[],[],[],[]],
								[[],[],[],[]],
								[[],[],[],[]]
								]
						)
			game.put()
		else:
			game=Game.get_by_key_name(game_key)
			if not game.player2 and game.player1 != user:
				#if this game doesn't have a player 2, then make the current user player 2
				game.player2 = user
				game.put()
		game_link = 'http://localhost:12080/?gamekey=' + game_key #local url for now
		token = channel.create_channel(user.user_id() + game_key)
		template_values = {
			'token' : token,
			'me': user.user_id(),
			'game_key' : game_key,
			'game_link' : game_link,
			'initial_message': GameUpdater(game).get_game_message()
		}
		template = jinja_environment.get_template('multi.html')
		self.response.out.write(template.render(template_values))

class SelectHandler(webapp2.RequestHandler):
	def post(self):
		game = GameFromRequest(self.request)get_game()
		user = users.get_current_user()
		if game and user:
			selectedPiece = str(self.request.get('selected'))
			GameUpdater(game).select_piece(selectedPiece)

class MoveHandler(webapp2.RequestHandler):
	def post(self):
		game = GameFromRequest(self.request).get_game()
		user = users.get_current_user()
		if game and user:
			movedPiece = str(self.request.get('moved')) #class, string
			rowcol = str(self.request.get('tile')) #rowcol, id of tile (remember to change html)
			GameUpdater(game).make_move(rowcol, movedPiece, user)

class OpenedPage(webapp2.RequestHandler):
	def post(self):
		game = GameFromRequest(self.request).get_game()
		GameUpdater(game).send_update()


app = webapp2.WSGIApplication([
    ('/', MainHandler),
    ('/play', GameHandler),
    ('/rules', InstructHandler),
    ('/about', AboutHandler),
    ('/multi', MultiHandler),
    ('/move', MoveHandler),
    ('/select', SelectHandler),
    ('/opened', OpenedPage)
], debug=True)
