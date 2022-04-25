const playerList = document.querySelector("#player-list");
const newPlayerInput = document.querySelector("#add-player span");
const newPlayerName = document.querySelector("#new-player-name");
const controllerButton = document.querySelector("#controller-button");
const questionTitle = document.querySelector("#question");
const guessName = document.querySelector("#guess .name");
const guessInput = document.querySelector("#guess input");
const answer = document.querySelector("#answer");
const guessVisibilityToggle = document.querySelector("#toggle-guess-visibility");

let currentGuesserIndex;
let visibileGuesses = true;
const players = {};
const avatarColors = ["red", "orange", "green", "purple"];

let currentQuestion;
let questions;
let completedQuestions = [];
let showingAnswer = false;

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
		if (id == playerId)
			playerId = id + 1;
	}

	const html = `<li class=\"player\" data-player-id=\"${playerId}\"><span class=\"profile\"><p class=\"avatar ${avatarColors[Math.floor(Math.random() * avatarColors.length)]}\" onclick=\"removePlayer(${playerId})\">${name.charAt(0)}</p><p class=\"name\">${name}</p></span><p class="score"></p><span class=\"guess\"><p class=\"correction\"></p><p class=\"number\"></p></span></li>`;
	
	// Add to player list
	const div = document.createElement("div");
	div.innerHTML = html;
	players[playerId] = playerList.insertBefore(div.firstElementChild, playerList.lastElementChild);

	hideNewPlayerInput();

	if (!controllerButton.classList.contains("active"))
		controllerButton.classList.add("active");
}

function removePlayer(id) {
	const player = playerList.querySelector(`.player[data-player-id=\"${id}\"]`);

	if (player) {
		player.remove();
		delete players[id];
	}
}

//#endregion

//#region QUIZ

function toggleGuessVisibility() {
	visibileGuesses = !visibileGuesses;

	if (visibileGuesses) {
		guessVisibilityToggle.classList.remove("active");
		playerList.classList.remove("hidden-guesses");
	} else {
		guessVisibilityToggle.classList.add("active");

		if (!showingAnswer)
			playerList.classList.add("hidden-guesses");
	}
}

function showAnswer() {
	showingAnswer = true;
	guessName.parentElement.classList.remove("active");
	controllerButton.setAttribute("onclick", "nextQuestion()");

	const correctAnswers = [];
	let winners = [];
	let lowestDifference;
	for (let i = 0; i < playerList.children.length - 1; i++) {
		const guess = playerList.children[i].querySelector(".guess .number");
		const guessNumber = parseInt(guess.textContent);
		const correction = guess.previousElementSibling;
		const difference = Math.abs(currentQuestion.answer - guessNumber);

		if (difference < currentQuestion.answer / 10) {
			correction.classList.add("correct");
			correctAnswers.push(correction);
		} else if (guessNumber > currentQuestion.answer) {
			correction.classList.add("down");
		} else {
			correction.classList.add("up");
		}

		if (lowestDifference == null || difference < lowestDifference) {
			winners = [correction];
			lowestDifference = difference;
		} else if (difference == lowestDifference) {
			winners.push(correction);
		}
	}

	for (let i = 0; i < winners.length; i++) {
		winners[i].classList.add("winner");
	}

	playerList.classList.remove("hidden-guesses");
	answer.classList.add("active");

	// Reveal answer with animation
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
    }, 1 / currentQuestion.answer);

	// Add score points
	winners = winners.concat(correctAnswers);

	for (let i = 0; i < winners.length; i++) {
		const scoreText = winners[i].parentElement.previousElementSibling;
		const score = scoreText.textContent ? parseInt(scoreText.textContent) : 0;
		scoreText.textContent = score + 100;
	}
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

	if (!visibileGuesses)
		playerList.classList.add("hidden-guesses");

	do {
		currentQuestion = questions[Math.floor(Math.random() * questions.length)];
	} while (completedQuestions.includes(currentQuestion.id));
	completedQuestions.push(currentQuestion.id);

	showingAnswer = false;
	questionTitle.textContent = currentQuestion.question.en;

	// Reset previous question
	answer.classList.remove("active");
	for (let i = 0; i < playerList.children.length - 1; i++) {
		const guessNumber = playerList.children[i].querySelector(".guess .number");
		guessNumber.textContent = null;
		guessNumber.previousElementSibling.classList.remove("down", "up", "correct", "winner");
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
		if (event.key == "Enter") {
			if (newPlayerInput.classList.contains("active") && newPlayerName.value)
				addPlayer();

			if (guessInput.parentElement.classList.contains("active") && guessInput.value)
				addPlayerGuess();
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