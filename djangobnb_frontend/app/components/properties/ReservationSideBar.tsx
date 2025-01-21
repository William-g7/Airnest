import { PropertyType } from "./PropertyList";

const ReservationSideBar = ({ property }: { property: PropertyType }) => {

    return (
        <aside className="mt-6 p-6 border border-gray-200 rounded-xl shadow-md">
            <div className="flex items-baseline mb-6">
                <span className="text-2xl font-bold">${property.price_per_night} CAD</span>
                <span className="text-lg text-gray-500 ml-2">night</span>
            </div>

            <div className="border border-gray-300 rounded-lg">
                <div className="grid grid-cols-2 divide-x">
                    <div className="p-4">
                        <div className="text-xs font-bold">CHECK-IN</div>
                        <div>01-03-2025</div>
                    </div>
                    <div className="p-4">
                        <div className="text-xs font-bold">CHECKOUT</div>
                        <div>01-08-2025</div>
                    </div>
                </div>

                <div className="border-t border-gray-300 p-4">
                    <label className="text-xs font-bold block mb-1">GUESTS</label>
                    <select className="w-full -ml-1 text-sm">
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                    </select>
                </div>
            </div>

            <button className="w-full bg-airbnb hover:bg-airbnb_dark text-white p-3 rounded-lg mt-4 font-semibold">
                Reserve
            </button>

            <p className="text-center text-gray-500 text-sm mt-2">
                You won't be charged yet
            </p>

            <div className="mt-4 space-y-4">
                <div className="flex justify-between">
                    <span className="underline">$1,556 CAD x 5 nights</span>
                    <span>$7,782 CAD</span>
                </div>
                <div className="flex justify-between">
                    <span className="underline">Cleaning fee</span>
                    <span>$865 CAD</span>
                </div>
                <div className="flex justify-between">
                    <span className="underline">Airbnb service fee</span>
                    <span>$1,319 CAD</span>
                </div>
                <div className="flex justify-between">
                    <span className="underline">Taxes</span>
                    <span>$1,297 CAD</span>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-300 flex justify-between font-bold">
                <span>Total</span>
                <span>$11,263 CAD</span>
            </div>
        </aside>
    )
};

export default ReservationSideBar;