const playerList = document.querySelector("#player-list");
const newPlayerInput = document.querySelector("#add-player span");
const newPlayerName = document.querySelector("#new-player-name");
const controllerButton = document.querySelector("#controller-button");
const questionTitle = document.querySelector("#question");
const guessName = document.querySelector("#guess .name");
const guessInput = document.querySelector("#guess input");
const answer = document.querySelector("#answer");

let currentGuesserIndex;
const players = {};
const avatarColors = ["red", "orange", "green", "purple"];

let currentQuestion;
let questions;
let completedQuestions = [];

const answerRealDuration = 1.5; // In seconds (exact)
const answerRevealSpeed = 4 / answerRealDuration / 1000;

//#region PLAYERS

function showNewPlayerInput() {
	newPlayerInput.classList.add("active");
	newPlayerName.focus();
}

function hideNewPlayerInput() {
	newPlayerName.value = null;
	newPlayerInput.classList.remove("active");
}

function addPlayer() {
	const name = newPlayerName.value;

	let playerId = 0;
	for (let i = 0; i < Object.keys(players).length; i++) {
		const id = parseInt(Object.keys(players)[i]);
		console.log(id);
		if (id == playerId)
			playerId = id + 1;
	}

	const html = `<li class=\"player\" data-player-id=\"${playerId}\"><span class=\"profile\"><p class=\"avatar ${avatarColors[Math.floor(Math.random() * avatarColors.length)]}\" onclick=\"removePlayer(${playerId})\">${name.charAt(0)}</p><p class=\"name\">${name}</p></span><span class=\"guess\"><p class=\"correction\"></p><p class=\"number\"></p></span></li>`;
	
	// Add to player list
	const div = document.createElement("div");
	div.innerHTML = html;
	players[playerId] = playerList.insertBefore(div.firstElementChild, playerList.lastElementChild);

	hideNewPlayerInput();

	if (!controllerButton.classList.contains("active"))
		controllerButton.classList.add("active");

	console.log(players);
}

function removePlayer(id) {
	const player = playerList.querySelector(`.player[data-player-id=\"${id}\"]`);

	if (player) {
		player.remove();
		delete players[id];

		console.log(players);
	}
}

//#endregion

//#region QUIZ

function showAnswer() {
	guessName.parentElement.classList.remove("active");

	let winner;
	let lowestDifference;
	for (let i = 0; i < playerList.children.length - 1; i++) {
		const guess = playerList.children[i].querySelector(".guess .number");
		const guessNumber = parseInt(guess.textContent);
		const correction = guess.previousElementSibling;
		const difference = Math.abs(currentQuestion.answer - guessNumber);

		if (difference < currentQuestion.answer / 10) {
			correction.classList.add("correct");
		} else if (guessNumber > currentQuestion.answer) {
			correction.classList.add("down");
		} else {
			correction.classList.add("up");
		}

		if (lowestDifference == null || difference < lowestDifference) {
			winner = correction;
			lowestDifference = difference;
		}
	}

	winner.classList.add("winner");

	answer.classList.add("active");

	let delay = 1 / (currentQuestion.answer);

	console.log(delay);
	const now = new Date();

	let currentNumber = 0;
	const answerRevealInterval = setInterval(function() {
        if (currentNumber >= currentQuestion.answer) {
			answer.textContent = currentQuestion.answer;
			clearInterval(answerRevealInterval);
			let timeDiff = new Date() - now;
			timeDiff /= 1000;
			console.log(Math.round(timeDiff * 100) / 100 + " seconds");
		} else {
			answer.textContent = currentNumber
		}

        currentNumber += Math.floor(currentQuestion.answer * answerRevealSpeed + (Math.random() * 2 - 1) * currentQuestion.answer * (answerRevealSpeed / 10));
    }, delay);

	controllerButton.setAttribute("onclick", "nextQuestion()");
}

function setGuesser() {
	guessName.textContent = playerList.children[currentGuesserIndex].querySelector(".name").textContent;
	guessInput.focus();
}

function addPlayerGuess() {
	if (!guessInput.value)
		return;

	playerList.children[currentGuesserIndex].querySelector(".guess .number").textContent = guessInput.value;
	guessInput.value = null;

	currentGuesserIndex++;

	if (currentGuesserIndex == playerList.children.length - 1)
		return showAnswer();

	setGuesser();
}

function nextQuestion() {
	if (completedQuestions.length == questions.length)
		completedQuestions = [];

	do {
		currentQuestion = questions[Math.floor(Math.random() * questions.length)];
	} while (completedQuestions.includes(currentQuestion.id));
	completedQuestions.push(currentQuestion.id);

	questionTitle.textContent = currentQuestion.question.en;

	// Reset previous question
	answer.classList.remove("active");
	for (let i = 0; i < playerList.children.length - 1; i++) {
		const guessNumber = playerList.children[i].querySelector(".guess .number");
		guessNumber.textContent = null;
		guessNumber.previousElementSibling.classList.remove("down", "up", "correct", "winner");
		console.log(guessNumber.previousElementSibling);
	}

	// Prepare guess input
	currentGuesserIndex = 0;
	setGuesser();
	guessName.parentElement.classList.add("active");
	controllerButton.setAttribute("onclick", "addPlayerGuess()");

	console.log(currentQuestion);
}

function startQuiz() {
	controllerButton.textContent = "Next";
	controllerButton.setAttribute("onclick", "nextQuestion()");

	fetch("questions.json").then(function(result) {
		return result.json();
	}).then(function(result) {
		questions = result.questions;
		console.log(questions);
		nextQuestion();
	});

}

//#endregion

function setUp() {
	for (let i = 0; i < playerList.children.length - 1; i++) {
		const id = parseInt(playerList.children[i].getAttribute("data-player-id"));
		players[id] = playerList.children[i];
	}

	document.addEventListener("keypress", function(event) {
		if (event.key == "Enter" && newPlayerInput.classList.contains("active")) {
			if (newPlayerName.value)
				addPlayer();
		}
	});

	document.addEventListener("click", function(event) {
		if (!newPlayerInput.parentElement.contains(event.target))
			hideNewPlayerInput();
	});

	if (Object.keys(players).length)
		controllerButton.classList.add("active");
}

setUp();