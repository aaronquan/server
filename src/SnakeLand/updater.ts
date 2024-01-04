import { Point } from "../Base/Math";
import { SnakeBodyData } from "./server";


export type SnakeUpdaterPlayerData = {
    lastUpdated: number;
    position: number[];
    rotation: number;
    bodyHistory: SnakeBodyData[];
}

export type SnakePlayerUpdater = {
    updateTime: number;
    position: Point;
    rotation: number;
    playerName?: string;
    bodyHistory: SnakeBodyData[];
}
