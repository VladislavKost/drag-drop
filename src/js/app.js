import { TasksManager } from "./TaskManager";

const container = document.querySelector(".container");
const taskManager = new TasksManager(container);
taskManager.bindToDOM();
