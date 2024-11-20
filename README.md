# Deliver XL Socket Server


### Broadcasting a new notification to the server:

- PARAMS:
    - title* (string): The title of the notification
    - message* (string): The message of the notification
    - uids (string[]): An array of uids to send the notification to
    - role (string out of 'CUSTOMER' or 'DRIVER'): The role of the user to send the notification to
    NOTE: Either uids or roles, or none of them can be provided, but not both


