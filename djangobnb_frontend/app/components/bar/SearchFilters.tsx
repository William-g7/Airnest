const SearchFilters = () => {
    return (
        <div className="h-[64px] flex flex-row items-center justify-between border rounded-full transition-all duration-500 ease-in-out">
            <div className="opacity-0 scale-0 lg:opacity-100 lg:scale-100 transition-all duration-500 ease-in-out absolute lg:relative lg:flex">
                <div className="flex flex-row items-center justify-between">
                    <div className="w-[250px] px-8 flex flex-col justify-center rounded-full hover:bg-gray-100 transition-colors duration-200">
                        <p className="text-xs font-semibold">Where</p>
                        <p className="text-sm">Anywhere</p>
                    </div>

                    <div className="w-[250px] px-8 flex flex-col justify-center rounded-full hover:bg-gray-100 transition-colors duration-200">
                        <p className="text-xs font-semibold">Check in</p>
                        <p className="text-sm">Add date</p>
                    </div>

                    <div className="w-[250px] px-8 flex flex-col justify-center rounded-full hover:bg-gray-100 transition-colors duration-200">
                        <p className="text-xs font-semibold">Check out</p>
                        <p className="text-sm">Add date</p>
                    </div>

                    <div className="w-[250px] px-8 flex flex-col justify-center rounded-full hover:bg-gray-100 transition-colors duration-200">
                        <p className="text-xs font-semibold">Who</p>
                        <p className="text-sm">Add guests</p>
                    </div>
                </div>
            </div>

            <div className="p-2">
                <button className="cursor-pointer p-2 lg:p-4 bg-airbnb hover:bg-airbnb_dark transition rounded-full text-white">
                    <svg
                        viewBox="0 0 32 32"
                        style={{ display: 'block', fill: 'none', height: '16px', width: '16px', stroke: 'currentColor', strokeWidth: 4, overflow: 'visible' }}
                        aria-hidden="true" role="presentation" focusable="false"
                    >
                        <path fill="none" d="M13 24a11 11 0 1 0 0-22 11 11 0 0 0 0 22zm8-3 9 9"></path>
                    </svg>
                </button>
            </div>




        </div>


    )
}

export default SearchFilters;