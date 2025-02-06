import Link from 'next/link';

const HomePage = () => {
  return (
    <div>
      <h1>My Next.js App</h1>
      
      <Link href="/chart">
        <a>Go to Chart Page</a>
      </Link>
    </div>
  );
};

export default HomePage;