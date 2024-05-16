import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/cloudflare";
import { Form, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    {
      name: "description",
      content: "Welcome to Remix! Using Vite and Cloudflare!",
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  let username = "";

  if (url.searchParams.has("username")) {
    username = url.searchParams.get("username") ?? "";
  }

  return json({ username });
}

export default function Index() {
  const { username } = useLoaderData<typeof loader>();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [numberOfKents, setNumberOfKents] = useState(2);

  /**
   * OMG a useEffect 😱
   * I just don't want to wire up a GitHub access token for this demo,
   * so I rely on the public API (which has a rate limit of 60 requests per minute).
   * This means I can leverage user's browser (and rate limit) instead of sending
   * everyone through my own on the server.
   */
  useEffect(() => {
    if (!username) return;

    async function fetchAvatar() {
      try {
        const response = await fetch(
          `https://api.github.com/users/${username}`
        );
        const data = (await response.json()) as unknown as {
          avatar_url: string;
        };

        setAvatar(data.avatar_url);
      } catch (error) {
        console.error(error);

        return null;
      }
    }

    fetchAvatar();
  }, [username]);

  return (
    <div className="relative">
      <div
        className="h-screen bg-center bg-repeat opacity-60"
        style={{
          backgroundImage: "url('/faces.jpg')",
          backgroundSize: "900px",
        }}
      ></div>
      <KentGrid numberOfKents={numberOfKents} />
      {avatar && (
        <Avatar
          src={avatar}
          className="absolute left-1/2 top-1/2 -translate-y-[120px]"
        />
      )}
      <Form className="absolute left-1/2 bottom-12 -translate-x-1/2 bg-white/90 rounded-lg shadow-2xl p-4 flex flex-col gap-2">
        <label className="uppercase text-sm block" htmlFor="username">
          GitHub Username
        </label>
        <input
          type="text"
          name="username"
          id="username"
          placeholder="jplhomer"
          defaultValue={username}
          className="p-2 border border-gray-300 rounded"
        />
        <button
          className="uppercase bg-black rounded p-2 text-white text-xs"
          type="submit"
        >
          Find Yourself
        </button>
      </Form>
      <div
        id="kent-meter"
        popover="auto"
        className="bg-black/70 text-white p-6 px-12 rounded-xl shadow-2xl"
      >
        <label className="uppercase text-sm block" htmlFor="numberOfKents">
          # of Kents:
        </label>
        <input
          id="numberOfKents"
          type="range"
          min={0}
          max={10}
          value={numberOfKents}
          onChange={(event) => setNumberOfKents(parseInt(event.target.value))}
        />
      </div>
    </div>
  );
}

function Avatar({ src, className }: { src: string; className?: string }) {
  const combinedClasses = `rounded-full w-[55px] h-[55px] ${
    className ? className : ""
  }`;
  return <img className={combinedClasses} src={src} alt="GitHub Avatar" />;
}

function Kent({ className }: { className?: string }) {
  return (
    <Avatar
      src="https://avatars.githubusercontent.com/u/1500684?v=4"
      className={className}
    />
  );
}

function KentGrid({ numberOfKents }: { numberOfKents: number }) {
  const kentGridPositions = [
    "-translate-x-[112px] -translate-y-[121px]",
    "translate-x-[112px] translate-y-[125px]",
    "-translate-x-[55px] translate-y-[68px]",
    "translate-x-[56px] -translate-y-[183px]",
    "translate-x-[169px] -translate-y-[59px]",
    "-translate-x-[224px] -translate-y-[59px]",
    "-translate-x-[56px] -translate-y-[245px]",
    "translate-x-[1px] translate-y-[246px]",
    "translate-x-[169px] translate-y-[248px]",
    "-translate-x-[168px] translate-y-[129px]",
  ];

  return (
    <>
      {Array.from({ length: numberOfKents }).map((_, index) => (
        <button
          key={index}
          popovertarget="kent-meter"
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${kentGridPositions[index]}`}
        >
          <Kent />
        </button>
      ))}
    </>
  );
}
