import axios from 'axios';
import { AuthFailedError, TokenExpiredError } from './errors';
import utm from './utm';

const API = 'https://snyk.io/api';
let attemptsLeft = 0;

function resetAttempts() {
  attemptsLeft = 30;
}

export default function authenticate(token) {
  resetAttempts();
  return testAuthComplete(token);
}

function testAuthComplete(token) {
  return axios
    .post(API + '/verify/callback?' + utm, {
      token,
    })
    .then(({ status, data }) => {
      return new Promise((resolve, reject) => {
        if (status !== 200) {
          return reject(AuthFailedError(data.message, status));
        }

        // we have success
        if (data.api) {
          return resolve({ data });
        }

        // we need to wait and poll again in a moment
        setTimeout(() => {
          attemptsLeft--;
          if (attemptsLeft > 0) {
            return resolve(testAuthComplete(token));
          }

          return reject(TokenExpiredError());
        }, 1000);
      });
    });
}
