import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import styles from '../styles/signupStyles';

const SignupScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 회원가입 요청 함수
  const handleSignup = async (email, password) => {
    if (password !== confirmPassword) {
      Alert.alert('비밀번호 불일치', '비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      // URL에 파라미터를 쿼리 스트링 형식으로 추가
      const url = `https://refresh-f5-server.o-r.kr/api/auth/register/deliver?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;

      const response = await fetch(url, {
        method: 'POST', // POST 방식으로 데이터 전송
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const result = await response.json();

      if (response.status === 200) {
        console.log('회원가입 성공:', result);
        Alert.alert('회원가입 성공', '계정이 생성되었습니다.');
        // 성공 시 다른 화면으로 이동 (예: 로그인 화면)
      } else {
        console.log('회원가입 실패:', result);
        Alert.alert('회원가입 실패', result.message || '다시 시도해 주세요.');
      }
    } catch (error) {
      console.error('회원가입 중 오류 발생:', error);
      Alert.alert('오류 발생', '회원가입 중 오류가 발생했습니다.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={styles.signupContainer}>
        <Text style={styles.signupLogo}>REFRESH</Text>
        <Text style={styles.signupSubtitle}>SIGN UP</Text>
        <TextInput
          placeholder="E-mail"
          style={styles.signupInput}
          placeholderTextColor="#FFFFFF"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="비밀번호"
          style={styles.signupInput}
          secureTextEntry
          placeholderTextColor="#FFFFFF"
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          placeholder="비밀번호 확인"
          style={styles.signupInput}
          secureTextEntry
          placeholderTextColor="#FFFFFF"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity style={styles.signupButton} onPress={() => handleSignup(email, password)}>
          <Text style={styles.signupButtonText}>회원가입</Text>
        </TouchableOpacity>
        <View style={styles.signupFooter}>
          <Text style={styles.signupLink}>이미 계정이 있나요? 로그인</Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default SignupScreen;
