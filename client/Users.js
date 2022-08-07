import {
  INIT_EVENT,
  USERS_UPDATE_EVENT,
  COLOR_SELECTION_EVENT,
} from "./Events.js";

export class Users {
  constructor(eventEmitter) {
    this.eventEmitter = eventEmitter;

    this.currentUser = document.getElementById("current-user");
    this.otherUsers = document.getElementById("other-users");

    this.addListeners();
  }

  addListeners = () => {
    this.eventEmitter.on(INIT_EVENT, this.handleInit);
    this.eventEmitter.on(USERS_UPDATE_EVENT, this.updateUsers);
    this.eventEmitter.on(COLOR_SELECTION_EVENT, this.handleColorSelection);
  };

  handleInit = ({ user, data }) => {
    this.user = user

    this.updateCurrentUser(user);
    this.updateUsers(data.users);
  };

  updateCurrentUser = (user) => {
    this.user = user;
    this.currentUser.style.backgroundColor = user.color;
  };

  updateUsers = (users) => {
    this.currentUser.style.backgroundColor = users[this.user.id].color;

    this.otherUsers.innerHTML = "";

    Object.values(users)
      .filter((user) => user.id !== this.user.id)
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
