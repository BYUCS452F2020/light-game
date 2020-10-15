export enum Constants {
  MSG_TYPES_START_GAME = 'start_game',
  MSG_TYPES_JOIN_GAME = 'join_game',
  MSG_TYPES_GAME_UPDATE = 'update_game',
  MSG_TYPES_INPUT = 'input',
  MSG_TYPES_GAME_OVER = 'dead',
  JOIN_ROOM = 'join_room',
  JOIN_ROOM_SUCCESS = 'join_room_suc',
  JOIN_ROOM_FAIL = 'join_room_fail',
  CREATE_ROOM = 'create_room',
  ROOM_CREATED = 'room_created',
  LEAVE_ROOM = 'leave_room',
  LEAVE_ROOM_SUCCESS = 'leave_room_suc',
  ROOM_WAITING_PLAYERS_RESPONSE = 'room_waiting_players_response', // Response containing players' usernames in the current room
}