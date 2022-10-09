import { useActiveLivePeerStreamId } from '../hooks/superfluid';
import { Player, createReactClient, studioProvider } from '@livepeer/react';
import { useEffect, useState } from 'react';
import { HLSVideo } from './HlsVideo';

const PosterImage = () => {
  return <img src={'//fpoimg.com/300x250?text=No current video'} alt="video placeholder" />;
};

export function Livepeer({ playbackId }: { playbackId: string }) {
  return <Player title="ad" playbackId={playbackId} loop autoPlay showTitle={false} muted poster={<PosterImage />} />;
}

const FlatPagePlayer = () => {
  const livePeerPlaybackId = useActiveLivePeerStreamId();

  const [livePeerClientInitialized, setLivePeerInitialized] = useState(false);

  useEffect(() => {
    createReactClient({
      provider: studioProvider({ apiKey: '755e9fa2-cf89-4742-a155-c981457277a8' }),
    });

    setLivePeerInitialized(true);
  }, []);

  if (!livePeerPlaybackId || !livePeerClientInitialized) return <PosterImage />;

  // return Livepeer({ playbackId: livePeerPlaybackId });

  return <HLSVideo src={`https://livepeercdn.com/hls/${livePeerPlaybackId}/index.m3u8`} autoPlay muted />;
};

export default FlatPagePlayer;
