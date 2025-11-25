import { View, Text } from 'react-native';

export default function TestScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      <Text style={{ color: '#fff' }}>Test Screen</Text>
    </View>
  );
}