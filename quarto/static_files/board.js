var board = [
			[[],[],[],[]],
			[[],[],[],[]],
			[[],[],[],[]],
			[[],[],[],[]],
			];

var traits = ["dark", "large", "rect", "hollow"];

/*Piece object use 1s and 0s*/
function GamePiece(dark, large, rect, hollow) {
	this.dark = dark;
	this.large = large;
	this.rect = rect;
	this.hollow = hollow;
};

function TileObject(row, col){
	this.row = row;
	this.col = col;
};

function isEmpty(cell){
	return (typeof cell == "undefined" || cell.length === 0);
};

function isFullRow(row_index){ 
	for (col in board[row_index]){
		if (isEmpty(board[row_index][col])){
			return false;
		};
	};
	return true;
};

function isFullCol(col_index){
	for (i=0;i<4;i++){
		if(isEmpty(board[i][col_index])){
			return false;
		};
	};
	return true;
};

function addToBoard(tileobject, gamepiece){
	var row = tileobject.row;
	var col = tileobject.col;
	(board[row][col]).push(gamepiece);
};

/*function winTest(trait, fourpieces){
	for (piece1=0;piece1<4;piece1++){
		for (piece2=0;piece2<4;piece2++){
			if (trait == "dark"){
				if (fourpieces[piece1].dark != fourpieces[piece2].dark){
					return false;
				};
			}
			else if (trait == "large"){
				if (fourpieces[piece1].large != fourpieces[piece2].large){
					return false;
				};
			}
			else if (trait == "rect"){
				if (fourpieces[piece1].rect != fourpieces[piece2].rect){
					return false;
				};
			}
			else if (trait == "hollow"){
				if (fourpieces[piece1].hollow != fourpieces[piece2].hollow){
					return false;
				};
			};
		};
		
	};
	return true;
};
*/

function winTest2(fourpieces){
	var darkcount = 0;
	var largecount = 0;
	var rectcount = 0;
	var hollowcount = 0;
	for (piece in fourpieces){
		darkcount += fourpieces[piece].dark;
		largecount += fourpieces[piece].large;
		rectcount += fourpieces[piece].rect;
		hollowcount += fourpieces[piece].hollow;
	};
	if (darkcount===0 || darkcount==4 || largecount===0 || largecount == 4 || rectcount === 0 || rectcount ==4 || hollowcount ===0 || hollowcount ==4){
		return true;
	};
	return false;
};
function assignTrait(piece, trait){
	if (piece.hasClass(trait)){
		return 1;
	}else{
		return 0;
	};
};

function testDiagWin(direction){
	var diagPieces = []
	if (direction == "topleft"){

		var col=0;
		for (row in board){
			if (!(isEmpty(board[row][col]))){
				diagPieces.push(board[row][col][0]);
			}else{

				return false;
			};
			col += 1;
		};
	}
	else if (direction == "topright"){
		var col=3;
		for (row in board){
			if (!(isEmpty(board[row][col]))){
				diagPieces.push(board[row][col][0]);
			}else{
				return false;
			}
			col -= 1;
		};
	};
/*	for (trait in traits){
		if (winTest(traits[trait], diagPieces)){
			return true;
		};
	};
	return false;*/
	return winTest2(diagPieces);
};

function testRCWin(tileobj, direction){
	var row = tileobj.row;
	var col = tileobj.col;
	var testPieces = []
	if (direction == "row"){
		for (col in board[row]){
			testPieces.push(board[row][col][0]);
		};
	}
	else if (direction == "col") {
		for (row in board){
				testPieces.push(board[row][col][0]);
		};
	};
	
	/*for (trait in traits){
		if (winTest(traits[trait], testPieces)){
			return true;
		};
	};
	return false;*/
	return winTest2(testPieces);
};


$(document).ready(function pseudoturn(){
	$('.piece.off').addClass('shadow');

	$('.piece.off').addClass('selectable')
	$('.piece.off[class!="selected"]').on("mouseenter",function(){
			$(this).removeClass('shadow')
		})
	$('.piece.off[class!="selected"]').on("mouseleave",function(){
			$(this).addClass('shadow')
		});
	


	$('.piece.off').on("click",function chosepiece(){
		
		$('.piece').removeClass('selected');
		$('.piece.off').addClass('shadow');
		$(this).removeClass('shadow')
		/*var movingPiece = new GamePiece($(this).hasClass('dark'), $(this).hasClass('large'), $(this).hasClass('rect'),$(this).hasClass('hollow'))*/
		var movingPiece = new GamePiece(assignTrait($(this),'dark'),assignTrait($(this),'large'),assignTrait($(this),'rect'),assignTrait($(this),'hollow'));

		$(this).addClass('selected');
		$('.piece.selected').off("mouseenter mouseleave");
		/*$(this).off("click");*/
		$('.piece.off').addClass('selectable')

		$('#nextturn').addClass('selectable')
			.on("click",function switchturns(){ 
				$('#nextturn')
					.removeClass('selectable')
					.off('click');
				$('.piece').removeClass('selectable')
					.off('click mouseenter mouseleave');
				$("#instruct").removeClass('hidden')
				$("#p1").toggleClass('hidden');
				$('#p2').toggleClass('hidden');

				$('.tile.unoc').addClass('selectable')
					.on("click",function chosetile(){
						$('.piece.selected').removeClass('shadow')
						/*otherwise piece on board has a shadow that's blue*/
						$(this).removeClass('unoc')
						
							.append($('.piece.selected'));

						var occTile = new TileObject(parseInt($(this).attr('row')),parseInt($(this).attr('col')));
						addToBoard(occTile,movingPiece);

						if ($('.piece.selected').hasClass('large')){
							$('.piece.selected').addClass('onlarge');
						} else{
							$('.piece.selected').addClass('onsmall');
						};
			
						$('.piece.selected').removeClass('off')
							.removeClass('selected');

						$('.tile').removeClass('selectable')
							.off("click");
						
						if (testDiagWin("topleft") || testDiagWin("topright")){
							$('#win').removeClass('hidden');
							return;
						};
						if (isFullRow(occTile.row)){								
							if (testRCWin(occTile,"row")){									
								$('#win').removeClass('hidden');
								return;
							};
						};
						if (isFullCol(occTile.col)){	
							if (testRCWin(occTile,"col")){
								$('#win').removeClass('hidden');
								return;
							};
						};
						return pseudoturn();

		});

	});
});
});