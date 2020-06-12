| End Point Name | Method   | Category | EndPoint              | Description                                                                      |
| -------------- | -------- | -------- | --------------------- | -------------------------------------------------------------------------------- |
| User Login     | **POST** | Users    | `/api/v1/user/signin` | This signs in a user to API                                                      |
| Get exam       | **GET**  | Users    | `/api/v1/user/exams`  | This gets the users current exam (if any), or returns a 404 if no exams          |
| Start exam     | **POST** | Users    | `/api/v1/user/exams`  | This starts user's current exam (if any) or returns a 404 if no exams            |
| Answer an exam | **PUT**  | Users    | `/api/v1/user/exams`  | This adds answers to exam if there's an active exam or returns a 404 if no exams |
