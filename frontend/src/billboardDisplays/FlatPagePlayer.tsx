import { useActiveLivePeerStreamId } from '../hooks/superfluid';
import { Player, createReactClient, studioProvider } from '@livepeer/react';
import { useEffect, useMemo, useState } from 'react';
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

  const livePeerUrl = useMemo(() => {
    if (!livePeerPlaybackId) return null;

    return `https://livepeercdn.com/hls/${livePeerPlaybackId}/index.m3u8`;
  }, [livePeerPlaybackId]);

  if (!livePeerUrl || !livePeerClientInitialized) return <PosterImage />;

  return <HLSVideo src={livePeerUrl} autoPlay muted />;
};

export default FlatPagePlayer;
