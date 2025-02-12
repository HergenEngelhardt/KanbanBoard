/**
 * Calculates the progress of subtasks.
 * @param {Array} subtasks - The subtasks array.
 * @returns {number} - Progress percentage.
 */
function calculateProgress(subtasks) {
    if (!Array.isArray(subtasks)) {
        console.warn("Invalid subtasks array. Returning 0 progress.");
        return 0;
    }

    let total = subtasks.length;
    let completed = subtasks.filter(subtask => subtask.completed).length;
    return total === 0 ? 0 : Math.round((completed / total) * 100);
}


/**
 * Updates the progress bar of a task on the board.
 * @param {string} taskId - The ID of the task.
 * @param {number} progressPercentage - The percentage of completed subtasks.
 */
function updateProgressBar(taskId, progressPercentage) {
    let progressBar = document.querySelector(`#task-${taskId} .progress-bar-fill`);
    if (progressBar) {
        progressBar.style.width = `${progressPercentage}%`;
        progressBar.style.backgroundColor = progressPercentage === 0 ? "lightgray" : "blue";

        let progressText = document.querySelector(`#task-${taskId} .progress-bar-text`);
        if (progressText) {
            progressText.textContent = `${progressPercentage}%`;
        }
    } else {
        console.warn(`Progress bar for Task ID ${taskId} not found.`);
    }
}


/**
 * Toggles the completion status of a subtask and updates the UI and database.
 * @param {string} taskId - The ID of the task.
 * @param {number} subtaskIndex - The index of the subtask in the subtasks array.
 */
async function toggleSubtaskCompletion(taskId, subtaskIndex) {
    let task = findTaskInData(taskId);
    if (!task || !task.subtasks) return;

    task.subtasks[subtaskIndex].completed = !task.subtasks[subtaskIndex].completed;

    try {
        await fetch(`${TASK_URL}/${task.category}/${taskId}/subtasks.json`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(task.subtasks),
        });

        let completed = task.subtasks.filter(st => st.completed).length;
        let total = task.subtasks.length;
        let progressPercentage = total === 0 ? 0 : Math.round((completed / total) * 100);

        progressBarfilling(taskId, task.category, progressPercentage, completed, total, task);
    } catch (error) {
        console.error(`Failed to save updated subtasks for Task ID ${taskId}:`, error);
    }
}


/**
 * Updates the progress bar, subtask counter, and overlay content.
 * @param {string} taskId - The ID of the task.
 * @param {string} category - The category of the task.
 * @param {number} progressPercentage - The progress percentage.
 * @param {number} completed - The number of completed subtasks.
 * @param {number} total - The total number of subtasks.
 * @param {Object} task - The task object.
 */
function progressBarfilling(taskId, category, progressPercentage, completed, total, task) {
    updateProgressBar(taskId, progressPercentage, completed, total);
    updateOverlayIfVisible(category, task);
}

/**
 * Updates the progress bar and subtask counter for a given task.
 * @param {string} taskId - The ID of the task.
 * @param {number} progressPercentage - The progress percentage.
 * @param {number} completed - The number of completed subtasks.
 * @param {number} total - The total number of subtasks.
 */
function updateProgressBar(taskId, progressPercentage, completed, total) {
    let progressBarContainer = document.querySelector(`#task-${taskId} .progress-bar-container`);

    if (!progressBarContainer) return;

    if (total > 0) {
        progressBarContainer.style.display = "block";
        let progressBarFill = progressBarContainer.querySelector(".progress-bar-fill");

        if (progressBarFill) {
            progressBarFill.style.width = `${progressPercentage}%`;
            progressBarFill.style.backgroundColor = progressPercentage === 0 ? "lightgray" : "blue";
        }

        let subtaskCounter = progressBarContainer.querySelector("span");
        if (subtaskCounter) {
            subtaskCounter.textContent = `${completed}/${total} Subtasks`;
        }
    } else {
        progressBarContainer.remove();
    }
}

/**
 * Updates the overlay content if the overlay is currently visible.
 * @param {string} category - The category of the task.
 * @param {Object} task - The task object.
 */
function updateOverlayIfVisible(category, task) {
    let overlay = document.getElementById('taskOverlay');
    if (overlay && overlay.style.display === 'block') {
        let overlayDetails = document.getElementById('overlayDetails');
        if (overlayDetails) {
            overlayDetails.innerHTML = getBoardOverlayTemplate(category, task);
        }
    }
}


/**
 * Calculates the progress percentage for subtasks.
 * @param {Array} subtasks - Array of subtasks.
 * @returns {number} - Progress percentage.
 */
function calculateProgressPercentage(subtasks) {
    let completed = subtasks.filter(subtask => subtask.completed).length;
    return subtasks.length === 0 ? 0 : Math.round((completed / subtasks.length) * 100);
}


/**
 * Updates the state of a subtask and triggers UI updates.
 * @param {object} task - The task object.
 * @param {number} subtaskIndex - The index of the subtask.
 */
function updateSubtaskState(task, subtaskIndex) {
    let subtasks = task.subtasks || [];
    if (!subtasks[subtaskIndex]) {
        console.error(`Subtask with index ${subtaskIndex} not found.`);
        return;
    }
    subtasks[subtaskIndex].completed = !subtasks[subtaskIndex].completed;
    updateSubtaskProgress(task.id, subtasks, task.category);
}


/**
 * Updates progress bar and syncs with Firebase.
 * @param {string} taskId - The ID of the task.
 * @param {Array} subtasks - The list of subtasks.
 * @param {string} category - The category of the task.
 */
function updateSubtaskProgress(taskId, subtasks, category) {
    let progress = calculateProgress(subtasks);
    updateProgressBar(taskId, progress);
    syncSubtasksWithFirebase(taskId, subtasks, category);
}
