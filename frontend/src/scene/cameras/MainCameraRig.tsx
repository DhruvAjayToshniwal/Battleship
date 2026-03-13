import CinematicCameraController from "./CinematicCameraController";

interface MainCameraRigProps {
  phase: "setup" | "playing" | "gameOver";
  isPlayerTurn: boolean;
  isFiring: boolean;
  lastFireCoord: string | null;
  boardSpacing: number;
}

export default function MainCameraRig(props: MainCameraRigProps) {
  return <CinematicCameraController {...props} />;
}
