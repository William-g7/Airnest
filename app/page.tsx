import Image from "next/image";
import Categories from "./components/Categories";
import PropertyList from "./components/properties/PropertyList";

export default function Home() {
  return (

    <main className="">
      <main className="max-w-[1500px]mx-auto px-6">
        <Categories />

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          <PropertyList />
        </div>
      </main>
    </main>
  );
}
