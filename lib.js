class UserSocketMap {
  constructor() {
    this.data = new Map();
  }

  add(userId, socket) {
    this.data.set(userId, socket);
  }

  getByUserId(userId) {
    return this.data.get(userId);
  }

  getBySocketId(socketId) {
    for (let [key, value] of this.data) {
      if (value.id === socketId) {
        return value;
      }
    }
  }

  removeBySocketId(socketId) {
    for (let [key, value] of this.data) {
      if (value.id === socketId) {
        this.data.delete(key);
        return;
      }
    }
  }

  removeByUserId(userId) {
    this.data.delete(userId);
  }

  getAll() {
    return this.data;
  }

  size() {
    return this.data.size;
  }

  clear() {
    this.data.clear();
  }

  has(userId) {
    return this.data.has(userId);
  }
}


module.exports = { UserSocketMap };
