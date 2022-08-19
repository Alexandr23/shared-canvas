import {
  INIT_EVENT,
  USERS_UPDATE_EVENT,
  COLOR_SELECTION_EVENT,
} from "./Events.js";

export class Users {
  constructor(eventEmitter) {
    this.eventEmitter = eventEmitter;

    this.currentUser = document.getElementById("current-user");
    this.currentUserName = document.getElementById("current-user-name");
    this.otherUsers = document.getElementById("other-users");

    this.addListeners();
  }

  addListeners = () => {
    this.eventEmitter.on(INIT_EVENT, this.handleInit);
    this.eventEmitter.on(USERS_UPDATE_EVENT, this.updateUsers);
    this.eventEmitter.on(COLOR_SELECTION_EVENT, this.handleColorSelection);
  };

  handleInit = ({ user, users }) => {
    this.user = user;

    this.updateCurrentUser(user);
    this.updateUsers(users);
  };

  updateCurrentUser = (user) => {
    this.user = user;
    this.currentUser.style.backgroundColor = user.color;
    this.currentUserName.innerHTML = user.name;
  };

  updateUsers = (users) => {
    const user = users.find(({ id }) => this.user && id === this.user.id);

    if (user) {
      this.updateCurrentUser(user);
    }

    this.otherUsers.innerHTML = "";

    users
      .filter(({ id }) => id !== this.user.id)
      .forEach((user) => {
        const item = document.createElement("div");
        item.className = "user";
        item.setAttribute("data-user-id", user.id);
        item.style.backgroundColor = user.color;
        this.otherUsers.append(item);
      });
  };

  handleColorSelection = ({ color }) => {
    this.user.color = color;
    this.currentUser.style.backgroundColor = color;
  };

  updateUserColor = ({ color, userId }) => {
    const user = document.querySelector("[data-user-id]", userId);

    if (user) {
      user.style.backgroundColor = color;
    } else {
      const item = document.createElement("div");
      item.className = "user";
      item.setAttribute("data-user-id", user.id);
      item.style.backgroundColor = user.color;
      this.otherUsers.append(item);
    }
  };
}
