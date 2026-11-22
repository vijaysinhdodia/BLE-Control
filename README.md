# Relay Control (Android)

Controls 4 relays on a YC_CAR_DEMO BLE board (service FFF0, write FFF2, board mode 02).

## Get the APK (no Android Studio needed)
1. Create a free GitHub account, make a new **public** repository.
2. Upload everything in this folder (keep the hidden `.github` folder).
3. Open the **Actions** tab, wait for "Build APK" to finish (about 5 to 8 minutes).
4. Open the finished run, download **relay-control-apk**, unzip it, copy `app-debug.apk` to your phone and install it.
   (Allow "install unknown apps" when asked.)

## Or build with Android Studio
npm install, npm run build, npx cap sync android, npx cap open android, then Build > Build APK(s).

## Change relay names
Edit the CH list at the top of src/main.js, then push again.
