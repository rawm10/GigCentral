import React, { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator, Text } from 'react-native';

export default function Index() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    console.log('Index routing:', { user: !!user, isLoading, segments, inAuthGroup });

    if (!user && !inAuthGroup) {
      console.log('No user, redirecting to login');
      router.replace('/login');
    } else if (user && !segments.length) {
      // User is logged in and at root, go to library
      console.log('User logged in, redirecting to library');
      router.replace('/(tabs)/library');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </View>
    );
  }

  // If user is logged in and we're at root, show loading while redirecting
  if (user && !segments.length) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" />
        <Text>Redirecting...</Text>
      </View>
    );
  }

  // If no user, show loading while redirecting to login
  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" />
        <Text>Redirecting to login...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Text>Redirecting...</Text>
    </View>
  );
}
