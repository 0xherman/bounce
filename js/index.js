(function ($) {
	let account = localStorage.getItem("account") || "";
	let chainId = localStorage.getItem("chainId") || null;
	const canConnect = typeof window.ethereum !== "undefined";

	let presaleId = new URLSearchParams(window.location.search).get("presaleId");

	if (presaleId) {
		loadPresaleData(presaleId);
		$("#presaleId").val(presaleId);
	}

	$("#addBtn").click(function() {
		$("#wallets").append(`
			<div class="wallet row p-3">
                <label>Wallet ${$("#wallets").children().length + 1}</label>
                <div class="form-group col-md-12">
                  <input type="text" class="form-control walletAddress" placeholder="Wallet address">
                </div>
                <div class="form-group col-md-12">
                  <input type="password" class="form-control privateKey" placeholder="Private key (throwaway address recommended)">
                </div>
                <div class="form-group col-md-12">
                  <input type="number" class="form-control contribution" placeholder="Contribution amount" min="0">
                </div>
                <div class="form-group col-md-4">
                  <label for="gwei">Gwei</label>
                  <input type="number" class="form-control gwei" id="gwei" value="1000">
                </div>
                <div class="form-group col-md-4">
                  <label for="limit">Gas Limit</label>
                  <input type="number" class="form-control limit" id="limit" value="100000">
                </div>
                <div class="form-group col-md-4">
                  <p>Gas cost:</p>
                  <span class="gasbnb">0.1</span> BNB
                </div>
              </div>
		`);
		$(".gwei").change(function() {
			const web3 = new window.Web3(window.ethereum);
			let gwei = parseInt(web3.utils.toWei($(this).val(), "gwei"));
			let limit = parseInt($(this).closest(".wallet").find(".limit").val());
			let bnb = web3.utils.fromWei((gwei * limit).toString());
			$(this).closest(".wallet").find(".gasbnb").text(bnb);
		});

		$(".limit").change(function() {
			const web3 = new window.Web3(window.ethereum);
			let gwei = parseInt(web3.utils.toWei($(this).closest(".wallet").find(".gwei").val(), "gwei"));
			let limit = parseInt($(this).val());
			let bnb = web3.utils.fromWei((gwei * limit).toString());
			$(this).closest(".wallet").find(".gasbnb").text(bnb);
		});
	}).click();

	$("#removeBtn").click(function() {
		$("#wallets").children().last().remove();
	})

	async function loadPresaleData(presaleId) {
		try {
			const web3 = new window.Web3(window.ethereum);

			const presaleContract = new web3.eth.Contract(presaleABI, presaleContractAddress);

			const details = await presaleContract.methods.passwordP(presaleId).call();

			console.log(details);

			const pre = new web3.eth.Contract(presaleABI1, presaleContractAddress1);
			const pool = await pre.methods.pools(presaleId).call();
			console.log(pool);
		} catch (err) {
			console.log(err);
			$("#presale-data").html("<h4 class='text-danger'>Failed to load</h4>")
		}
	}

	$("#loadBtn").click(() => {
		presaleId = $("#presaleId").val();
		loadPresaleData(presaleId);
	});

	async function purchase() {
		try {
			const web3 = new window.Web3(window.ethereum);
			const presaleContract = new web3.eth.Contract(presaleABI, presaleContractAddress);
			presaleId = $("#presaleId").val();

			$(".wallet").each(async function(index, wallet) {
				const address = $(wallet).find(".walletAddress").val();
				const privateKey = $(wallet).find(".privateKey").val();
				const contribution = $(wallet).find(".contribution").val();
				const wei = web3.utils.toWei(contribution, "ether");
				const nonce = parseInt(await web3.eth.getTransactionCount(address));
				const gasPrice = web3.utils.toWei($(wallet).find(".gwei").val(), "gwei");
				const gas = $(wallet).find(".limit").val();
				console.log(address, privateKey, contribution, wei, nonce);

				let txBuilder = presaleContract.methods.bid(presaleId, wei, "");
				let encoded = txBuilder.encodeABI();
				let transaction = {
					nonce: web3.utils.toHex(nonce),
					data: encoded,
					from: address,
					to: presaleContractAddress,
					gas: gas,
					gasPrice: gasPrice,
					value: wei
				};

				await web3.eth.accounts.signTransaction(transaction, privateKey, function(error, signature) {
					if (error) {
						console.log(error);
					} else {
						web3.eth.sendSignedTransaction(signature.rawTransaction).on("receipt", function(receipt) {
							console.log(receipt);
						});
					}
				});
			});
		} catch (err) {
			alert("An error occurred somewhere lol.");
		}
	}

	$("#purchaseBtn").click(purchase);
})(jQuery);