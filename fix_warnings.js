const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    const fullPath = path.join(__dirname, 'frontend', 'src', 'screens', filePath);
    if (!fs.existsSync(fullPath)) {
        console.log(`File not found: ${fullPath}`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');

    // Remove BOM if present
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
        console.log(`Removed BOM from ${filePath}`);
    }

    for (const { search, replace, isRegex } of replacements) {
        if (isRegex) {
            content = content.replace(search, replace);
        } else {
            content = content.split(search).join(replace);
        }
    }

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${filePath}`);
}

replaceInFile('PCBAdmin/ReorderPCBAdminCreateOrderPCBScreen.jsx', [
    { search: 'const [uploadPaymentSlip, { isLoading: isUploadingSlip }] =', replace: 'const [uploadPaymentSlip] =' },
    { search: '  }, [formData, shippingData]);', replace: '    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [formData, shippingData]);' }
]);

replaceInFile('PaymentScreen.jsx', [
    { search: 'FaMoneyBillWave,', replace: '' },
    { search: 'FaTimes,', replace: '' },
    { search: 'FaClock,', replace: '' },
    { search: 'FaCalendarAlt,', replace: '' },
    { search: 'FaBox,', replace: '' },
    { search: '  const [transferedDate, setTransferedDate] = useState("");', replace: '  const [transferedDate] = useState("");' },
    { search: '  }, [cart.receivePlace]);', replace: '    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [cart.receivePlace]);' },
    { search: '  }, [cart, navigate, isBuyNow, orderType, language]);', replace: '    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [cart, navigate, isBuyNow, orderType, language]);' },
    // Also might be other dependency arrays
    { isRegex: true, search: /  }, \[cart, navigate, isBuyNow, orderType, language\]\);/g, replace: '    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [cart, navigate, isBuyNow, orderType, language]);' },
    { isRegex: true, search: /  }, \[cart\.receivePlace\]\);/g, replace: '    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [cart.receivePlace]);' }
]);

replaceInFile('ProductAllScreen.jsx', [
    { search: '  const handleCategoryChange = (e) => {\n    setCategory(e.target.value);\n  };', replace: '' }
]);

replaceInFile('ProductScreen.jsx', [
    { search: 'const { data: reviews, refetch, isFetching } = useGetReviewsQuery(productId);', replace: 'const { data: reviews, refetch } = useGetReviewsQuery(productId);' },
    { search: 'const [deleteReview, { isLoading: loadingDeleteReview }] = useDeleteReviewMutation();', replace: 'const [deleteReview] = useDeleteReviewMutation();' },
    { search: 'const totalPrice = useSelector((state) => state.cart.totalPrice);', replace: '' },
    { search: 'const tempOrderId = useSelector((state) => state.cart.tempOrderId);', replace: '' },
    { isRegex: true, search: /alt="image"/g, replace: 'alt="product"' },
    { isRegex: true, search: /alt="Product image"/g, replace: 'alt="Product"' },
    { isRegex: true, search: /alt="picture"/g, replace: 'alt="product"' }
]);

replaceInFile('ProfileScreen.jsx', [
    { search: 'FaIdCard,', replace: '' },
    { isRegex: true, search: /target="_blank"/g, replace: 'target="_blank" rel="noreferrer"' }
]);

replaceInFile('Quotation/QuotationDefaultDetailScreen.jsx', [
    { search: 'const thaiBahtText = require("thai-baht-text");', replace: '' },
    { search: 'import thaiBahtText from "thai-baht-text";', replace: '' },
    { search: '  const thaiBahtText = (amount) => {', replace: '  // const thaiBahtText = (amount) => {' }
]);

replaceInFile('Quotation/QuotationSetScreen.jsx', [
    { search: 'const [due_date, setdue_date] = useState("");', replace: 'const [due_date] = useState("");' }
]);

replaceInFile('Quotation/QuotationSetSelectedCustomerScreen.jsx', [
    { search: '  const itemsToUse = quotationData?.quotation?.[0] || quotationData?.quotation || [];', replace: '' }
]);

console.log('Done!');
