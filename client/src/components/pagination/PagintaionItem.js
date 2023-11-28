import React, { memo } from 'react'
import clsx from 'clsx'
const PagintaionItem = ({ children }) => {
    return (
        <div
            className={
                clsx(
                    'w-10 h-10 cursor-pointer flex justify-center hover:rounded-full hover:bg-gray-300',
                    !Number(children) && 'items-end pb-2',
                    Number(children) && 'items-center'
                )}
        >
            {children}
        </div>
    )
}

export default memo(PagintaionItem)