import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/cloudflare";
import { Form, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";

export const meta: MetaFunction = (context) => {
  const searchParams = new URLSearchParams(context.location.search);
  let username = context.params.username ?? "";

  if (searchParams.has("username")) {
    username = searchParams.get("username") ?? "";
  }

  const description = `Find @${username ?? "yourself"} at React Conf 2024`;

  return [
    { title: "React Conf Faces" },
    {
      name: "description",
      content: description,
    },
    {
      name: "twitter:card",
      content: "summary_large_image",
    },
    {
      name: "twitter:title",
      content: "React Conf Faces",
    },
    {
      name: "twitter:description",
      content: description,
    },
    {
      name: "twitter:image",
      content: `https://react-conf-snapshots.jplhomer.workers.dev/?username=${username}&version=2`,
    },
    {
      name: "twitter:image:type",
      content: "image/jpeg",
    },
    {
      name: "twitter:image:width",
      content: "1920",
    },
    {
      name: "twitter:image:height",
      content: "1080",
    },
    {
      name: "og:description",
      content: description,
    },
    {
      name: "og:image",
      content: `https://react-conf-snapshots.jplhomer.workers.dev/?username=${username}&version=2`,
    },
    {
      name: "og:image:type",
      content: "image/jpeg",
    },
    {
      name: "og:image:width",
      content: "1920",
    },
    {
      name: "og:image:height",
      content: "1080",
    },
  ];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  let username = params.username ?? "";

  if (url.searchParams.has("username")) {
    username = url.searchParams.get("username") ?? "";
  }

  return json({ username, isScreenshot: url.searchParams.has("screenshot") });
}

export default function Index() {
  const { username, isScreenshot } = useLoaderData<typeof loader>();
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
    <div className="relative overflow-hidden">
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
      {!isScreenshot && (
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
          {username && (
            <a
              className="text-xs uppercase flex items-center justify-center gap-2"
              href={`https://twitter.com/intent/tweet?text=I%20found%20myself%20at%20React%20Conf%202024%20https%3A%2F%2Freact-conf-faces.jplhomer.workers.dev%2F${username}`}
              target="_blank"
            >
              <span>Share on</span>
              <XLogo className="h-4 w-4" />
            </a>
          )}
        </Form>
      )}
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

function XLogo({ className }: { className?: string }) {
  return (
    <svg
      width="1200"
      height="1227"
      viewBox="0 0 1200 1227"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"
        fill="black"
      />
    </svg>
  );
}
