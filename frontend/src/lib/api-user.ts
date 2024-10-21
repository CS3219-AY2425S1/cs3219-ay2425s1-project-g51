import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_USER_API_URL;

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, { email, password });
    return response.data;
  } catch (error: unknown) {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          throw new Error("Invalid email or password! Please try again.");
        case 403:
          throw new Error("Unauthorized access!");
        default:
          throw new Error(`An error occurred: ${error.response.status}`);
      }
    } else {
      throw new Error("Network error or server did not respond!");
    }
  }
};

export const registerUser = async (userData: { username: string; email: string; password: string }) => {
  try {
    const response = await axios.post(`${BASE_URL}/users`, userData);
    return response.data;
  } catch (error: unknown) {
        if (error.response) {
          switch (error.response.status) {
            case 409:
              throw new Error("Username or email already exists!");
            case 400:
              throw new Error("Invalid input data! Please check your fields.");
            case 401:
              throw new Error("Unauthorized access! Please log in.");
            case 500:
              throw new Error("Internal server error! Please try again later.");
            default:
              throw new Error(`An error occurred: ${error.response.status}`);
          }
        } else {
          throw new Error("Network error or server did not respond!");
        }
  }
};

export const verifyToken = async (token: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/auth/verify-token`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: unknown) {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          throw new Error("Unauthorized access! Please log in.");
        case 403:
          throw new Error("User verification failed!");
        default:
          throw new Error(`An error occurred: ${error.response.status}`);
      }
    } else {
      throw new Error("Network error or server did not respond!");
    }
  }
};

export const updateUser = async (userId: string, token: string, data: { username: string, email: string }) => {
  try {
    const response = await axios.patch(`${BASE_URL}/users/${userId}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    })
    return response
  } catch (error: unknown) {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          throw new Error("Unauthorized access! Please log in.");
        case 404:
          throw new Error("User not found!");
        case 400:
          throw new Error("Invalid input data! Please check your fields.");
        default:
          throw new Error(`An error occurred: ${error.response.status}`);
      }
    } else {
      throw new Error("Network error or server did not respond!");
    }
  }
}

export const updatePassword = async (userId: string, token: string, password: string) => {
  try {
    const response = await axios.patch(`${BASE_URL}/users/${userId}`, {
        "password": password,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    return response.data;
  } catch (error: unknown) {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          throw new Error("Unauthorized access! Please log in.");
        case 400:
          throw new Error("Invalid new password!");
        case 404:
          throw new Error("User not found!");
        default:
          throw new Error(`An error occurred: ${error.response.status}`);
      }
    } else {
      throw new Error("Network error or server did not respond!");
    }
  }
};
