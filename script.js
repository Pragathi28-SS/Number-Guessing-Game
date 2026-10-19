// ====================================
// 1. GET HTML ELEMENTS
// ====================================

const guessForm = document.getElementById("guessForm");
const guessInput = document.getElementById("guessInput");
const guessButton = document.getElementById("guessButton");

const attemptsLeft = document.getElementById("attemptsLeft");
const totalGuesses = document.getElementById("totalGuesses");
const bestScore = document.getElementById("bestScore");

const hiddenNumber = document.getElementById("hiddenNumber");
const rangeText = document.getElementById("rangeText");

const feedback = document.getElementById("feedback");
const feedbackIcon = document.getElementById("feedbackIcon");
const feedbackText = document.getElementById("feedbackText");

const guessHistory = document.getElementById("guessHistory");

const difficulty = document.getElementById("difficulty");
const restartButton = document.getElementById("restartButton");


// ====================================
// 2. GAME VARIABLES
// ====================================

let secretNumber;
let remainingAttempts;
let guessCount = 0;

let gameOver = false;

let previousGuesses = [];

let bestScores = loadBestScores();


// ====================================
// 3. LOAD BEST SCORES
// ====================================

function loadBestScores() {
    try {
        const savedScores = JSON.parse(
            localStorage.getItem("numberQuestBestScores") || "{}"
        );

        if (
            savedScores &&
            typeof savedScores === "object" &&
            !Array.isArray(savedScores)
        ) {
            return savedScores;
        }
    } catch (error) {
        // Continue playing even if saved scores cannot be read.
    }

    return {};
}


// ====================================
// 4. START A NEW GAME
// ====================================

function startGame() {

    // Generate a random number between 1 and 100.

    secretNumber = Math.floor(Math.random() * 100) + 1;

    // Read the selected difficulty.

    remainingAttempts = Number(difficulty.value);

    // Reset game values.

    guessCount = 0;
    previousGuesses = [];
    gameOver = false;

    // Reset the input.

    guessInput.value = "";
    guessInput.disabled = false;
    guessButton.disabled = false;

    // Reset the display.

    hiddenNumber.textContent = "?";

    attemptsLeft.textContent = remainingAttempts;
    totalGuesses.textContent = 0;

    rangeText.textContent = "Possible range: 1–100";

    // Display the starting message.

    showFeedback(
        "✦",
        "Make your first guess to receive a clue.",
        ""
    );

    // Reset history and display the best score.

    displayHistory();
    displayBestScore();

    guessInput.focus();
}


// ====================================
// 5. SHOW CLUES AND MESSAGES
// ====================================

function showFeedback(icon, message, type) {

    feedbackIcon.textContent = icon;
    feedbackText.textContent = message;

    feedback.className = "feedback";

    if (type !== "") {
        feedback.classList.add(type);
    }
}


// ====================================
// 6. DISPLAY BEST SCORE
// ====================================

function displayBestScore() {

    const score = bestScores[difficulty.value];

    if (Number.isInteger(score) && score > 0) {
        bestScore.textContent = score;
    } else {
        bestScore.textContent = "—";
    }
}


// ====================================
// 7. DISPLAY GUESS HISTORY
// ====================================

function displayHistory() {

    guessHistory.innerHTML = "";

    if (previousGuesses.length === 0) {

        const message = document.createElement("span");

        message.className = "empty-message";
        message.textContent = "Your guesses will appear here.";

        guessHistory.appendChild(message);

        return;
    }

    // Display the latest guess first.

    for (let i = previousGuesses.length - 1; i >= 0; i--) {

        const item = document.createElement("span");

        item.className = "guess-item " + previousGuesses[i].type;

        item.textContent =
            previousGuesses[i].number +
            " · " +
            previousGuesses[i].label;

        guessHistory.appendChild(item);
    }
}


// ====================================
// 8. UPDATE THE POSSIBLE RANGE
// ====================================

function updateRange() {

    let lowest = 1;
    let highest = 100;

    for (let i = 0; i < previousGuesses.length; i++) {

        const number = previousGuesses[i].number;

        if (number < secretNumber && number >= lowest) {
            lowest = number + 1;
        }

        if (number > secretNumber && number <= highest) {
            highest = number - 1;
        }
    }

    rangeText.textContent =
        "Possible range: " + lowest + "–" + highest;

    return highest - lowest + 1;
}


// ====================================
// 9. CHECK THE PLAYER'S GUESS
// ====================================

guessForm.addEventListener("submit", function (event) {

    event.preventDefault();

    // Do not accept guesses after the game ends.

    if (gameOver) {
        return;
    }

    const inputValue = guessInput.value.trim();
    const guess = Number(inputValue);

    // Validate the input.

    if (
        inputValue === "" ||
        !Number.isInteger(guess) ||
        guess < 1 ||
        guess > 100
    ) {

        showFeedback(
            "!",
            "Enter a whole number between 1 and 100.",
            "error"
        );

        return;
    }

    // Prevent duplicate guesses.

    for (let i = 0; i < previousGuesses.length; i++) {

        if (previousGuesses[i].number === guess) {

            showFeedback(
                "!",
                "You already tried this number. Try another one.",
                "warning"
            );

            guessInput.select();

            return;
        }
    }

    // Count the valid guess.

    guessCount++;
    remainingAttempts--;

    totalGuesses.textContent = guessCount;
    attemptsLeft.textContent = remainingAttempts;

    let message;
    let icon;
    let label;
    let type;


    // CASE 1: CORRECT GUESS

    if (guess === secretNumber) {

        message =
            "Excellent! You found the number in " +
            guessCount +
            (guessCount === 1 ? " guess!" : " guesses!");

        icon = "✓";
        label = "Correct";
        type = "correct";

        endGame(true);

    }

    // CASE 2: NO ATTEMPTS LEFT

    else if (remainingAttempts === 0) {

        message =
            "Game over! The secret number was " +
            secretNumber +
            ". Start a new game to try again.";

        icon = "!";
        label = "Miss";
        type = "low";

        endGame(false);

    }

    // CASE 3: GUESS IS TOO LOW

    else if (guess < secretNumber) {

        const difference = secretNumber - guess;

        label = "Too low";
        type = "low";
        icon = "↑";

        if (difference > 30) {

            message =
                "Much too low! Try a considerably higher number.";

        } else if (difference > 10) {

            message =
                "Too low! You're getting closer. Guess higher.";

        } else {

            message =
                "Too low! You're very close. Try a little higher.";

        }

    }

    // CASE 4: GUESS IS TOO HIGH

    else {

        const difference = guess - secretNumber;

        label = "Too high";
        type = "high";
        icon = "↓";

        if (difference > 30) {

            message =
                "Much too high! Try a considerably lower number.";

        } else if (difference > 10) {

            message =
                "Too high! You're getting closer. Guess lower.";

        } else {

            message =
                "Too high! You're very close. Try a little lower.";

        }
    }


    // Save the guess.

    previousGuesses.push({
        number: guess,
        label: label,
        type: type
    });


    // Update the history.

    displayHistory();


    // Update the possible range.

    if (!gameOver) {

        const possibleNumbers = updateRange();

        if (possibleNumbers <= 10) {

            message += " The possible range is now narrowed down!";
        }
    }


    // Display the clue.

    showFeedback(icon, message, type);


    // Prepare for the next guess.

    if (!gameOver) {

        guessInput.value = "";
        guessInput.focus();
    }

});


// ====================================
// 10. END THE GAME
// ====================================

function endGame(won) {

    gameOver = true;

    guessInput.disabled = true;
    guessButton.disabled = true;

    // Reveal the secret number.

    hiddenNumber.textContent = secretNumber;

    // Save the best score if the player wins.

    if (won) {

        const level = difficulty.value;
        const oldScore = bestScores[level];

        if (
            !Number.isInteger(oldScore) ||
            guessCount < oldScore
        ) {

            bestScores[level] = guessCount;

            try {

                localStorage.setItem(
                    "numberQuestBestScores",
                    JSON.stringify(bestScores)
                );

            } catch (error) {

                // The game still works if storage is unavailable.

            }
        }

        displayBestScore();
    }
}


// ====================================
// 11. BUTTON EVENT LISTENERS
// ====================================

// Start a new game.

restartButton.addEventListener("click", startGame);


// Restart when the difficulty changes.

difficulty.addEventListener("change", startGame);


// ====================================
// 12. START THE GAME
// ====================================

startGame();