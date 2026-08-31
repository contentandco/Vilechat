import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export function useImagePicker(onImageSelected: (base64ImageData: string) => Promise<void>) {
  const [pickingImage, setPickingImage] = useState<boolean>(false);

  const selectImage = async (useCamera: boolean = false) => {
    const { status } = useCamera 
      ? await ImagePicker.requestCameraPermissionsAsync() 
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Denied', `We need access to your ${useCamera ? 'camera' : 'gallery'} to send images.`);
      return;
    }

    try {
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.3,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.3,
            base64: true,
          });

      if (result.canceled || !result.assets || !result.assets[0].base64) {
        return;
      }

      setPickingImage(true);
      const base64Data = `data:image/jpeg;base64,${result.assets[0].base64}`;
      await onImageSelected(base64Data);
    } catch (err) {
      Alert.alert('Error', 'Failed to pick or send image.');
    } finally {
      setPickingImage(false);
    }
  };

  return {
    selectImage,
    pickingImage,
  };
}
