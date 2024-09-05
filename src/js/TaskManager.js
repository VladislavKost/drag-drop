export class TasksManager {
  constructor(parentEl) {
    this.parentEl = parentEl;
    this.draggedElement = undefined;
    this.activeAddButton = undefined;
    this.activeCardInput = undefined;
    this.insertMarker = undefined;

    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseOver = this.onMouseOver.bind(this);
    this.onDiscard = this.onDiscard.bind(this);
    this.onAddNewCard = this.onAddNewCard.bind(this);
    this.generateStages = this.generateStages.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.createMarker = this.createMarker.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);

    this.generateStages();
    this.items = this.parentEl.querySelectorAll(".items");

    this.loadState();
  }

  static get addInput() {
    return `
            <input class="input-card-text" type="text" maxlength="40" placeholder="Введите название карточки" />
            <div class='button-box'>
                <button class="button-add-card">Добавить карту</button>
                <button class="button-discard">X</button>
            </div>
        `;
  }

  static get addNewCard() {
    return `
        <div class="card-name"></div>
        <div class="delete">Х</div>
        `;
  }

  static stageColumn(stage_name) {
    return `
      <div class='stage-name'>${stage_name}</div>
      <hr>
      <ul class="items">
      </ul>
      <button class="btn-add">+ Add another card</button>
    `;
  }

  saveState() {
    const data = {
      stages: [],
    };

    this.parentEl.querySelectorAll(".stage").forEach((stage) => {
      const stageName = stage.querySelector("div").textContent;
      const cards = [];

      stage.querySelectorAll(".items li").forEach((card) => {
        const cardName = card.querySelector(".card-name");
        if (cardName) {
          cards.push(cardName.textContent);
        }
      });

      data.stages.push({
        name: stageName,
        cards: cards,
      });
    });

    localStorage.setItem("tasks", JSON.stringify(data));
  }

  loadState() {
    const data = JSON.parse(localStorage.getItem("tasks"));
    if (data && data.stages) {
      data.stages.forEach((stage) => {
        const stageEls = this.parentEl.querySelectorAll(".stage .stage-name");
        const rightStage = Array.from(stageEls).find((el) =>
          el.textContent.includes(stage.name),
        );
        const ul = rightStage.parentNode.querySelector(".items");

        stage.cards.forEach((card) => {
          this.createCard(ul, card);
        });
      });
    }
  }

  generateStages() {
    const stages = ["To Do", "In progress", "Done"];
    stages.forEach((stage) => {
      const div = document.createElement("div");
      div.innerHTML = TasksManager.stageColumn(stage);
      div.classList.add("stage");
      this.parentEl.appendChild(div);
    });
  }

  bindToDOM() {
    const addButtons = this.parentEl.querySelectorAll(".btn-add");
    addButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const currentButton = e.target;

        const div = document.createElement("div");
        div.innerHTML = TasksManager.addInput;
        div.classList.add("card-input");
        currentButton.parentNode.insertBefore(div, currentButton);

        const discardButton = div.querySelector(".button-discard");
        discardButton.addEventListener("click", this.onDiscard);

        const addCardButton = div.querySelector(".button-add-card");
        addCardButton.addEventListener("click", this.onAddNewCard);

        button.classList.add("hidden");
        this.activeAddButton = button;
        this.activeCardInput = div;
      });
    });

    this.items.forEach((item) => {
      item.addEventListener("mousedown", this.onMouseDown);
    });
  }

  createMarker(e) {
    this.insertMarker = document.createElement("li");
    this.insertMarker.classList.add("insert-marker");
  }

  onMouseDown(e) {
    e.preventDefault();
    if (e.target.tagName === "LI" || e.target.tagName === "DIV") {
      this.draggedElement = e.target.closest("li");

      const rect = this.draggedElement.getBoundingClientRect();
      this.diffX = e.clientX - rect.x;
      this.diffY = e.clientY - rect.y;
      this.width = rect.right - rect.left;
      this.height = rect.bottom - rect.top;

      this.draggedElement.classList.add("mouseDown");
      this.draggedElement.classList.add("dragged");

      const ul = e.target.closest("ul");
      const li = e.target.closest("li");
      this.createMarker(e);
      ul.insertBefore(this.insertMarker, li);

      document.documentElement.addEventListener("mouseup", this.onMouseUp);
      document.documentElement.addEventListener("mouseover", this.onMouseOver);
    }
  }

  onAddNewCard(e) {
    const closestInput =
      e.target.parentNode.parentNode.querySelector(".input-card-text");
    const closesStage = e.target.closest(".stage");
    const ul = closesStage.querySelector(".items");
    if (closestInput && closestInput.value) {
      const inputValue = closestInput.value;

      this.createCard(ul, inputValue);

      this.onDiscard();
      this.saveState();
    }
  }

  onDiscard(e) {
    if (this.activeAddButton) {
      this.activeAddButton.classList.remove("hidden");
      this.activeAddButton = undefined;
    }

    if (this.activeCardInput) {
      this.activeCardInput.remove();
      this.activeCardInput = undefined;
    }
  }

  onMouseUp(e) {
    const closestUl = e.target.closest("ul");
    if (closestUl) {
      this.draggedElement.classList.remove("dragged");
      this.draggedElement.classList.remove("mouseDown");
      if (closestUl.children.length > 0) {
        closestUl.insertBefore(this.draggedElement, e.target);
        this.insertMarker.remove();
      } else {
        this.insertMarker.remove();
        closestUl.appendChild(this.draggedElement);
      }

      this.saveState();
    }

    this.draggedElement.classList.remove("mouseDown");
    this.draggedElement.classList.remove("dragged");
    this.draggedElement = undefined;

    document.documentElement.removeEventListener("mouseup", this.onMouseUp);
    document.documentElement.removeEventListener("mouseover", this.onMouseOver);
  }

  onMouseOver(e) {
    const ul = e.target.closest("ul");
    if (ul && e.target.tagName === "LI") {
      if (!this.insertMarker) {
        this.createMarker(e);
        ul.insertBefore(this.insertMarker, e.target);
      } else if (this.insertMarker && e.target !== this.insertMarker) {
        this.insertMarker.remove();
        this.createMarker(e);
        if (ul.lastChild == e.target) {
          ul.appendChild(this.insertMarker);
        } else {
          ul.insertBefore(this.insertMarker, e.target);
        }
      }
    } else if (
      ul &&
      e.target.tagName == "UL" &&
      e.target.children.length === 0
    ) {
      this.insertMarker.remove();
      this.createMarker(e);
      e.target.appendChild(this.insertMarker);
    }

    this.draggedElement.style.top = e.clientY - this.diffY + "px";
    this.draggedElement.style.left = e.clientX - this.diffX + "px";
  }

  createCard(ul, inputValue) {
    const li = document.createElement("li");

    li.classList.add("items-item");
    li.innerHTML = TasksManager.addNewCard;

    const cardName = li.querySelector(".card-name");
    cardName.appendChild(document.createTextNode(inputValue));

    ul.appendChild(li);

    const deleteButton = li.querySelector(".delete");
    deleteButton.addEventListener("click", this.onDelete);
  }

  onDelete(e) {
    e.target.parentNode.remove();
    this.saveState();
  }
}
