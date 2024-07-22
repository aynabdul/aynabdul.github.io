import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp, signIn, resetPassword } from '../../services/authServices';
import styles from './LoginPageStyles.module.css'; 

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      if (isSignUp) {
        await signUp(email, password, username);
        setMessage('Sign up successful! Redirecting...');
      } else {
        await signIn(email, password);
        setMessage('Login successful! Redirecting...');
      }
      setTimeout(() => navigate('/admin'), 2000); // Navigate after 2 seconds
    } catch (error) {
      setError(error.message);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setMessage('');
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    try {
      const result = await resetPassword(email);
      setMessage(result);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formcontainer}>
        <h1>DevFolio</h1>
        <p className={styles.description}>
          Have your free, live and customizable portfolio website to showcase your masterpieces!
        </p>
        <h2>{isSignUp ? 'Sign Up' : 'Log In'}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          {isSignUp && (
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
          )}
          <button type="submit">{isSignUp ? 'Sign Up' : 'Log In'}</button>
        </form>
        <button className={styles.switchbutton} onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'Already a user? Log In!' : 'New here? Sign Up!'}
        </button>
        {!isSignUp && (
          <button className={styles.resetbutton} onClick={handleResetPassword}>Forgot Password?</button>
        )}
        {error && <div className={`${styles.popup} ${styles.error} ${styles.show}`}>{error}</div>}
        {message && <div className={`${styles.popup} ${styles.success} ${styles.show}`}>{message}</div>}
      </div>
    </div>
  );
};

export default LoginPage;
