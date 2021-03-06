import React, { useState } from "react";
import useUser from "../lib/useUser";
import Layout from "../components/Layout";
import fetchJson from "../lib/fetchJson";
import { Button, TextField } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";

const Login = () => {
  const { mutateUser } = useUser({
    redirectTo: "/home",
    redirectIfFound: true,
  });

  const [errors, setErrors] = useState<String[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const body = {
      email,
      password,
    };

    try {
      let data = await fetchJson("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      await mutateUser(data);
    } catch (error) {
      console.error("An unexpected error happened:", error);
      setErrors(error.data.errors);
    }
  };

  return (
    <Layout>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div className="login" style={{ maxWidth: 500 }}>
          {errors.map((error) => (
            <Alert
              severity="error"
              icon={false}
              style={{
                marginBottom: 20,
                backgroundColor: "rgb(53 8 0)",
                color: "rgb(255 215 212)",
              }}
            >
              {error}
            </Alert>
          ))}
          <TextField
            label="Email"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            style={{ marginBottom: 20 }}
          />
          <TextField
            label="Password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            type="password"
            autoComplete="current-password"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleLogin}
            size="medium"
            style={{ marginTop: 10, display: "block" }}
          >
            Login
          </Button>

          <p style={{ marginTop: 30 }}>
            Dont have an account?{" "}
            <a href="/signup" style={{ color: "#4b8ef5", fontWeight: 800 }}>
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
