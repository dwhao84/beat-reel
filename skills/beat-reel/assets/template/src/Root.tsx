import React from "react";
import { Composition } from "remotion";
import { z } from "zod";
import { PhotoReel } from "./PhotoReel";
import { FONT_PRESET, FPS, HEIGHT, totalFrames, WIDTH } from "./config";
import { TRIPS } from "./trips";

const schema = z.object({
  tripId: z.string(),
  fontPreset: z.enum(["serif", "weibei", "yuan"]),
});

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {TRIPS.map((trip) => (
        <Composition
          key={trip.id}
          id={trip.id}
          component={PhotoReel}
          schema={schema}
          defaultProps={{ tripId: trip.id, fontPreset: FONT_PRESET }}
          durationInFrames={totalFrames(trip)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
      ))}
    </>
  );
};
